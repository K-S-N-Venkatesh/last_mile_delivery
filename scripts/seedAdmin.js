require("dotenv").config();

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

async function seedAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const passwordHash = await bcrypt.hash("Admin@123", 12);

    await connection.execute(
        `INSERT INTO users
        (name, email, password_hash, role, phone, status)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            "System Admin",
            "admin@delivery.com",
            passwordHash,
            "ADMIN",
            "9999999999",
            "ACTIVE"
        ]
    );

    console.log("✅ Admin created successfully!");

    await connection.end();
}

seedAdmin();