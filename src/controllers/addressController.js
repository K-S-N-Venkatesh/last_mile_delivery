const pool = require("../config/db");
const { get } = require("../routes/authRoutes");

const createAddress = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            address_line,
            area_id,
            landmark,
            pincode,
            latitude,
            longitude,
            is_default
        } = req.body;

        if (!address_line || !area_id) {
            return res.status(400).json({
                message: "Address line and area are required"
            });
        }
        // Verify that the area exists
        const [areas] = await pool.execute(
            `SELECT id, zone_id, pincode
             FROM areas
             WHERE id = ?`,
            [area_id]
        );

        if (areas.length === 0) {
            return res.status(404).json({
                message: "Area not found"
            });
        }
        
        if (pincode && areas[0].pincode !== pincode) {
            return res.status(400).json({
                message: "Pincode does not belong to the selected area"
            });
        }

        if (is_default) {
            await pool.execute(
                `UPDATE addresses
                 SET is_default = 0
                 WHERE user_id = ?`,
                [userId]
            );
        }

        const [result] = await pool.execute(
            `INSERT INTO addresses
            (
                user_id,
                address_line,
                area_id,
                landmark,
                pincode,
                latitude,
                longitude,
                is_default
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                address_line,
                area_id,
                landmark || null,
                pincode || areas[0].pincode,
                latitude || null,
                longitude || null,
                is_default ? 1 : 0
            ]
        );

        res.status(201).json({
            message: "Address added successfully",
            addressId: result.insertId,
            zoneId: areas[0].zone_id
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getMyAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const [addresses] = await pool.execute(
            `SELECT
                a.id,
                a.address_line,
                a.landmark,
                a.pincode,
                a.latitude,
                a.longitude,
                a.is_default,
                a.created_at,
                ar.id AS area_id,
                ar.name AS area_name,
                ar.city,
                ar.state,
                z.id AS zone_id,
                z.name AS zone_name
             FROM addresses a
             JOIN areas ar ON a.area_id = ar.id
             JOIN zones z ON ar.zone_id = z.id
             WHERE a.user_id = ?
             ORDER BY a.is_default DESC, a.id DESC`,
            [userId]
        );

        res.json(addresses);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createAddress,
    getMyAddresses
};