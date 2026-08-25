const pool = require("../config/db");

const createRateCard = async (req, res) => {
    try {
        const {
            customer_type,
            rate_type,
            min_weight,
            max_weight,
            rate
        } = req.body;

        if (
            !customer_type ||
            !rate_type ||
            min_weight == null ||
            max_weight == null ||
            rate == null
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!["B2B", "B2C"].includes(customer_type)) {
            return res.status(400).json({
                message: "Invalid customer type"
            });
        }

        if (!["INTRA_ZONE", "INTER_ZONE"].includes(rate_type)) {
            return res.status(400).json({
                message: "Invalid rate type"
            });
        }

        if (min_weight < 0 || max_weight <= min_weight) {
            return res.status(400).json({
                message: "Invalid weight range"
            });
        }

        if (rate < 0) {
            return res.status(400).json({
                message: "Rate cannot be negative"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO rate_cards
            (customer_type, rate_type, min_weight, max_weight, rate)
            VALUES (?, ?, ?, ?, ?)`,
            [
                customer_type,
                rate_type,
                min_weight,
                max_weight,
                rate
            ]
        );

        res.status(201).json({
            message: "Rate card created successfully",
            rateCardId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getRateCards = async (req, res) => {
    try {
        const [rates] = await pool.execute(
            `SELECT
                id,
                customer_type,
                rate_type,
                min_weight,
                max_weight,
                rate,
                status,
                created_at
             FROM rate_cards
             ORDER BY customer_type, rate_type, min_weight`
        );

        res.json(rates);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updateRateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            min_weight,
            max_weight,
            rate
        } = req.body;

        if (
            min_weight == null ||
            max_weight == null ||
            rate == null
        ) {
            return res.status(400).json({
                message: "min_weight, max_weight and rate are required"
            });
        }

        if (min_weight < 0 || max_weight <= min_weight) {
            return res.status(400).json({
                message: "Invalid weight range"
            });
        }

        if (rate < 0) {
            return res.status(400).json({
                message: "Rate cannot be negative"
            });
        }

        const [result] = await pool.execute(
            `UPDATE rate_cards
             SET min_weight = ?,
                 max_weight = ?,
                 rate = ?
             WHERE id = ?`,
            [
                min_weight,
                max_weight,
                rate,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Rate card not found"
            });
        }

        res.json({
            message: "Rate card updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updateRateCardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({
                message: "Status must be ACTIVE or INACTIVE"
            });
        }

        const [result] = await pool.execute(
            `UPDATE rate_cards
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Rate card not found"
            });
        }

        res.json({
            message: `Rate card ${status.toLowerCase()} successfully`
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createRateCard,
    getRateCards,
    updateRateCard,
    updateRateCardStatus
};