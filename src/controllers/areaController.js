const pool = require("../config/db");

const createArea = async (req, res) => {
    try {
        const {
            name,
            city,
            state,
            pincode,
            zone_id
        } = req.body;

        if (!name || !city || !state || !pincode || !zone_id) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check whether zone exists
        const [zones] = await pool.execute(
            "SELECT id FROM zones WHERE id = ?",
            [zone_id]
        );

        if (zones.length === 0) {
            return res.status(404).json({
                message: "Zone not found"
            });
        }

        // Prevent duplicate area/pincode
        const [existing] = await pool.execute(
            "SELECT id FROM areas WHERE pincode = ?",
            [pincode]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Area with this pincode already exists"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO areas
            (name, city, state, pincode, zone_id)
            VALUES (?, ?, ?, ?, ?)`,
            [name, city, state, pincode, zone_id]
        );

        res.status(201).json({
            message: "Area created successfully",
            areaId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getAreasByZone = async (req, res) => {
    try {
        const { zoneId } = req.params;

        const [areas] = await pool.execute(
            `SELECT id, name, city, state, pincode, zone_id
             FROM areas
             WHERE zone_id = ?
             ORDER BY id`,
            [zoneId]
        );

        res.json(areas);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createArea,
    getAreasByZone
};