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

const registerAgent = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            name,
            email,
            password,
            phone,
            vehicle_type,
            vehicle_number,
            license_number
        } = req.body;

        // 1. Basic validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                message: "Name, email, password and phone are required"
            });
        }

        // 2. Check existing email
        const [existingUser] = await connection.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 4. Start transaction
        await connection.beginTransaction();

        // 5. Create AGENT user
        const [userResult] = await connection.execute(
            `INSERT INTO users
            (name, email, password_hash, role, phone)
            VALUES (?, ?, ?, 'AGENT', ?)`,
            [
                name,
                email,
                passwordHash,
                phone
            ]
        );

        const userId = userResult.insertId;

        // 6. Create agent profile
        await connection.execute(
            `INSERT INTO agent_profiles
            (
                user_id,
                vehicle_type,
                vehicle_number,
                license_number,
                availability_status,
                verification_status
            )
            VALUES (?, ?, ?, ?, 'OFFLINE', 'PENDING')`,
            [
                userId,
                vehicle_type || null,
                vehicle_number || null,
                license_number || null
            ]
        );

        // 7. Commit
        await connection.commit();

        return res.status(201).json({
            message: "Agent registration submitted successfully",
            agentId: userId,
            verificationStatus: "PENDING"
        });

    } catch (error) {
        await connection.rollback();

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        connection.release();
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

const verifyAgent = async (req, res) => {
    try {
        const { agentId } = req.params;

        // Check whether the user exists and is an agent
        const [agents] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.status,
                ap.verification_status
             FROM users u
             JOIN agent_profiles ap
                ON u.id = ap.user_id
             WHERE u.id = ?
               AND u.role = 'AGENT'`,
            [agentId]
        );

        if (agents.length === 0) {
            return res.status(404).json({
                message: "Agent not found"
            });
        }

        // Prevent unnecessary verification
        if (agents[0].verification_status === "VERIFIED") {
            return res.status(400).json({
                message: "Agent is already verified"
            });
        }

        // Verify the agent
        await pool.execute(
            `UPDATE agent_profiles
             SET verification_status = 'VERIFIED'
             WHERE user_id = ?`,
            [agentId]
        );

        return res.status(200).json({
            message: "Agent verified successfully",
            agentId: Number(agentId)
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updateAgentAvailability = async (req, res) => {
    try {
        const { availability_status } = req.body;

        if (!["AVAILABLE", "BUSY", "OFFLINE"].includes(availability_status)) {
            return res.status(400).json({
                message: "Invalid availability status"
            });
        }

        const [agents] = await pool.execute(
            `SELECT
                ap.verification_status,
                ap.availability_status
             FROM agent_profiles ap
             JOIN users u
                ON ap.user_id = u.id
             WHERE ap.user_id = ?
               AND u.role = 'AGENT'`,
            [req.user.id]
        );

        if (agents.length === 0) {
            return res.status(404).json({
                message: "Agent profile not found"
            });
        }

        if (
            availability_status === "AVAILABLE" &&
            agents[0].verification_status !== "VERIFIED"
        ) {
            return res.status(403).json({
                message: "Agent must be verified before becoming available"
            });
        }

        await pool.execute(
            `UPDATE agent_profiles
             SET availability_status = ?
             WHERE user_id = ?`,
            [
                availability_status,
                req.user.id
            ]
        );

        return res.status(200).json({
            message: "Availability updated successfully",
            availabilityStatus: availability_status
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    registerCustomer,
    registerAgent,
    verifyAgent,
    updateAgentAvailability,
    login
};