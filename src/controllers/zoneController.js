const pool = require("../config/db");

const createZone = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Zone name is required"
            });
        }

        const [existing] = await pool.execute(
            "SELECT id FROM zones WHERE name = ?",
            [name]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Zone already exists"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO zones (name, description)
             VALUES (?, ?)`,
            [name, description || null]
        );

        res.status(201).json({
            message: "Zone created successfully",
            zoneId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getZones = async (req, res) => {
    try {
        const [zones] = await pool.execute(
            `SELECT id, name, description, status, created_at
             FROM zones
             ORDER BY id`
        );

        res.json(zones);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createZone,
    getZones
};