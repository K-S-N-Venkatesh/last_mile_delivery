const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const registerCustomer = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            customer_type,
            business_name,
            business_registration_number,
            tax_id
        } = req.body;

        // 1. Basic validation
        if (!name || !email || !password || !phone || !customer_type) {
            return res.status(400).json({
                message: "Required fields are missing"
            });
        }

        // 2. Validate customer type
        if (!["B2B", "B2C"].includes(customer_type)) {
            return res.status(400).json({
                message: "Invalid customer type"
            });
        }

        // 3. B2B-specific validation
        if (
            customer_type === "B2B" &&
            (!business_name || !business_registration_number || !tax_id)
        ) {
            return res.status(400).json({
                message: "Business details are required for B2B registration"
            });
        }

        // 4. Check existing email
        const [existingUser] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // 5. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 6. Create user
        const [userResult] = await pool.execute(
            `INSERT INTO users
            (name, email, password_hash, role, phone)
            VALUES (?, ?, ?, 'CUSTOMER', ?)`,
            [name, email, passwordHash, phone]
        );

        const userId = userResult.insertId;

        // 7. Create customer profile
        await pool.execute(
            `INSERT INTO customer_profiles
            (user_id, customer_type, business_name,
             business_registration_number, tax_id)
            VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                customer_type,
                customer_type === "B2B" ? business_name : null,
                customer_type === "B2B"
                    ? business_registration_number
                    : null,
                customer_type === "B2B" ? tax_id : null
            ]
        );

        return res.status(201).json({
            message: "Customer registered successfully",
            userId
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [users] = await pool.execute(
            `SELECT id, name, email, password_hash, role, status
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Account is not active"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    registerCustomer,
    login
};