const pool = require("../config/db");

const createNotification = async ({
    userId,
    orderId,
    eventType,
    recipient,
    message,
    connection = pool
}) => {
    await connection.execute(
        `INSERT INTO notifications
        (
            user_id,
            order_id,
            channel,
            event_type,
            recipient,
            message,
            status
        )
        VALUES (?, ?, 'EMAIL', ?, ?, ?, 'PENDING')`,
        [
            userId,
            orderId,
            eventType,
            recipient,
            message
        ]
    );
};

module.exports = {
    createNotification
};