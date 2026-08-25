const pool = require("../config/db");

const createCodRate = async (req, res) => {
    try {
        const {
            customer_type,
            surcharge_type,
            surcharge_value
        } = req.body;

        if (
            !customer_type ||
            !surcharge_type ||
            surcharge_value == null
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

        if (!["FIXED", "PERCENTAGE"].includes(surcharge_type)) {
            return res.status(400).json({
                message: "Invalid surcharge type"
            });
        }

        if (surcharge_value < 0) {
            return res.status(400).json({
                message: "Surcharge cannot be negative"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO cod_rates
            (customer_type, surcharge_type, surcharge_value)
            VALUES (?, ?, ?)`,
            [
                customer_type,
                surcharge_type,
                surcharge_value
            ]
        );

        res.status(201).json({
            message: "COD rate created successfully",
            codRateId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    createCodRate
};