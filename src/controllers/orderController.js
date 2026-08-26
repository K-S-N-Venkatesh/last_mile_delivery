const { createNotification } = require("../services/notificationService");

const pool = require("../config/db");
const { get } = require("../routes/authRoutes");
// const { get } = require("../routes/authRoutes");
const { calculateOrderPrice } = require("../services/pricingService");

const createOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Order creation logic will go here
        const {
            customer_id,
            pickup_address_id,
            delivery_address_id
        } = req.body;

        let customerId;

        // CUSTOMER can only create orders for themselves
        if (req.user.role === "CUSTOMER") {
            customerId = req.user.id;
        }

        // ADMIN can create orders on behalf of a customer
        else if (req.user.role === "ADMIN") {
            if (!customer_id) {
                return res.status(400).json({
                    message: "customer_id is required for admin-created orders"
                });
            }

            customerId = customer_id;
        }

        // Validate addresses
        if (!pickup_address_id || !delivery_address_id) {
            return res.status(400).json({
                message: "Pickup and delivery addresses are required"
            });
        }

        // Make sure customer exists
        const [customers] = await connection.execute(
            `SELECT id
            FROM users
            WHERE id = ?
            AND role = 'CUSTOMER'`,
            [customerId]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        // Get pickup address and zone
        const [pickupAddresses] = await connection.execute(
            `SELECT
                a.id,
                a.user_id,
                a.area_id,
                ar.zone_id
            FROM addresses a
            JOIN areas ar ON a.area_id = ar.id
            WHERE a.id = ?`,
            [pickup_address_id]
        );

        // Get delivery address and zone
        const [deliveryAddresses] = await connection.execute(
            `SELECT
                a.id,
                a.user_id,
                a.area_id,
                ar.zone_id
            FROM addresses a
            JOIN areas ar ON a.area_id = ar.id
            WHERE a.id = ?`,
            [delivery_address_id]
        );

        if (pickupAddresses.length === 0) {
            return res.status(404).json({
                message: "Pickup address not found"
            });
        }

        if (deliveryAddresses.length === 0) {
            return res.status(404).json({
                message: "Delivery address not found"
            });
        }

        const pickupAddress = pickupAddresses[0];
        const deliveryAddress = deliveryAddresses[0];

        // Make sure both addresses belong to the customer
        if (
            pickupAddress.user_id !== customerId ||
            deliveryAddress.user_id !== customerId
        ) {
            return res.status(403).json({
                message: "Addresses do not belong to the customer"
            });
        }

        const pickupZoneId = pickupAddress.zone_id;
        const deliveryZoneId = deliveryAddress.zone_id;

        const {
            length_cm,
            width_cm,
            height_cm,
            actual_weight_kg,
            order_type,
            payment_type,
            items
        } = req.body;

        // Validate package dimensions and weight
        if (
            !length_cm ||
            !width_cm ||
            !height_cm ||
            !actual_weight_kg
        ) {
            return res.status(400).json({
                message: "Package dimensions and actual weight are required"
            });
        }

        if (
            Number(length_cm) <= 0 ||
            Number(width_cm) <= 0 ||
            Number(height_cm) <= 0 ||
            Number(actual_weight_kg) <= 0
        ) {
            return res.status(400).json({
                message: "Dimensions and weight must be greater than zero"
            });
        }

        // Validate order type
        if (!["B2B", "B2C"].includes(order_type)) {
            return res.status(400).json({
                message: "Invalid order type"
            });
        }

        // Validate payment type
        if (!["PREPAID", "COD"].includes(payment_type)) {
            return res.status(400).json({
                message: "Invalid payment type"
            });
        }

        // Validate order items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "At least one order item is required"
            });
        }

        for (const item of items) {
            if (
                !item.product_name ||
                !item.quantity ||
                item.unit_price === undefined
            ) {
                return res.status(400).json({
                    message: "Each item must contain product_name, quantity and unit_price"
                });
            }

            if (
                Number(item.quantity) <= 0 ||
                Number(item.unit_price) < 0
            ) {
                return res.status(400).json({
                    message: "Invalid item quantity or unit price"
                });
            }
        }

        let productTotal = 0;

        for (const item of items) {
            productTotal +=
                Number(item.quantity) *
                Number(item.unit_price);
        }

        const pricing = await calculateOrderPrice({
            pickupZoneId,
            deliveryZoneId,
            customerType: order_type,
            paymentType: payment_type,
            lengthCm: Number(length_cm),
            widthCm: Number(width_cm),
            heightCm: Number(height_cm),
            actualWeightKg: Number(actual_weight_kg)
        });

        let codAmount = 0;

        if (payment_type === "COD") {
            codAmount =
                productTotal +
                pricing.deliveryCharge +
                pricing.codSurcharge;
        }

        const [orderResult] = await connection.execute(
            `INSERT INTO orders
            (
                customer_id,
                pickup_address_id,
                delivery_address_id,
                pickup_zone_id,
                delivery_zone_id,
                length_cm,
                width_cm,
                height_cm,
                actual_weight_kg,
                volumetric_weight_kg,
                chargeable_weight_kg,
                order_type,
                payment_type,
                cod_amount,
                rate_type,
                rate_card_id,
                delivery_charge,
                cod_surcharge,
                total_charge,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLACED')`,
            [
                customerId,
                pickup_address_id,
                delivery_address_id,
                pickupZoneId,
                deliveryZoneId,
                Number(length_cm),
                Number(width_cm),
                Number(height_cm),
                Number(actual_weight_kg),
                pricing.volumetric_weight_kg,
                pricing.chargeable_weight_kg,
                order_type,
                payment_type,
                codAmount,
                pricing.rateType,
                pricing.rateCardId,
                pricing.deliveryCharge,
                pricing.codSurcharge,
                pricing.totalCharge
            ]
        );

        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.execute(
                `INSERT INTO order_items
                (
                    order_id,
                    product_name,
                    quantity,
                    unit_price
                )
                VALUES (?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_name,
                    Number(item.quantity),
                    Number(item.unit_price)
                ]
            );
        }

        await connection.execute(
            `INSERT INTO order_tracking_history
            (
                order_id,
                status,
                changed_by,
                notes
            )
            VALUES (?, 'PLACED', ?, ?)`,
            [
                orderId,
                req.user.id,
                req.user.role === "ADMIN"
                    ? "Order placed by admin on behalf of customer"
                    : "Order placed by customer"
            ]
        );

        const [customerUsers] = await connection.execute(
            `SELECT email
                FROM users
                WHERE id = ?`,
            [customerId]
            );

            if (customerUsers.length > 0) {
            await createNotification({
                userId: customerId,
                orderId,
                eventType: "ORDER_CREATED",
                recipient: customerUsers[0].email,
                message: `Your order #${orderId} has been created successfully.`,
                connection
            });
        }

        await connection.commit();

        res.status(201).json({
            message: "Order created successfully",
            orderId,
            pricing: {
                volumetricWeightKg: pricing.volumetric_weight_kg,
                chargeableWeightKg: pricing.chargeable_weight_kg,
                rateType: pricing.rateType,
                deliveryCharge: pricing.deliveryCharge,
                codSurcharge: pricing.codSurcharge,
                totalCharge: pricing.totalCharge,
                codAmount: codAmount
            },
            status: "PLACED"
        });
    } catch (error) {
        await connection.rollback();

        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });

    } finally {
        connection.release();
    }
};

const getOrders = async (req, res) => {
    try {
        let query = `
            SELECT
                o.id,
                o.customer_id,
                u.name AS customer_name,
                o.pickup_address_id,
                o.delivery_address_id,
                o.pickup_zone_id,
                o.delivery_zone_id,
                o.actual_weight_kg,
                o.volumetric_weight_kg,
                o.chargeable_weight_kg,
                o.order_type,
                o.payment_type,
                o.rate_type,
                o.delivery_charge,
                o.cod_surcharge,
                o.total_charge,
                o.assigned_agent_id,
                o.status,
                o.created_at,
                o.updated_at
            FROM orders o
            JOIN users u ON o.customer_id = u.id
        `;

        const params = [];

        // Customer can see only their own orders
        if (req.user.role === "CUSTOMER") {
            query += ` WHERE o.customer_id = ?`;
            params.push(req.user.id);
        }

        query += ` ORDER BY o.created_at DESC`;

        const [orders] = await pool.execute(query, params);

        res.json(orders);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const assignOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { agent_id, assignment_type } = req.body;

        // 1. Validate input
        if (!agent_id) {
            return res.status(400).json({
                message: "agent_id is required"
            });
        }

        if (
            assignment_type &&
            !["MANUAL", "AUTO"].includes(assignment_type)
        ) {
            return res.status(400).json({
                message: "Invalid assignment type"
            });
        }

        const assignmentType = assignment_type || "MANUAL";

        // 2. Check order
        const [orders] = await connection.execute(
            `SELECT
                id,
                status,
                assigned_agent_id
             FROM orders
             WHERE id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        // 3. Only PLACED orders can be assigned
        if (order.status !== "PLACED") {
            return res.status(400).json({
                message: "Only PLACED orders can be assigned"
            });
        }

        // 4. Prevent assigning an already assigned order
        if (order.assigned_agent_id !== null) {
            return res.status(400).json({
                message: "Order is already assigned to an agent"
            });
        }

        // 5. Check agent
        const [agents] = await connection.execute(
            `SELECT
                u.id,
                u.name,
                u.status AS user_status,
                ap.verification_status,
                ap.availability_status
             FROM users u
             JOIN agent_profiles ap
                ON u.id = ap.user_id
             WHERE u.id = ?
               AND u.role = 'AGENT'`,
            [agent_id]
        );

        if (agents.length === 0) {
            return res.status(404).json({
                message: "Agent not found"
            });
        }

        const agent = agents[0];

        // 6. Agent account must be active
        if (agent.user_status !== "ACTIVE") {
            return res.status(400).json({
                message: "Agent account is not active"
            });
        }

        // 7. Agent must be verified
        if (agent.verification_status !== "VERIFIED") {
            return res.status(400).json({
                message: "Agent is not verified"
            });
        }

        // 8. Agent must be available
        if (agent.availability_status !== "AVAILABLE") {
            return res.status(400).json({
                message: "Agent is not available"
            });
        }

        // 9. Create assignment history
        await connection.execute(
            `INSERT INTO agent_assignments
            (
                order_id,
                agent_id,
                assignment_type,
                assigned_by
            )
            VALUES (?, ?, ?, ?)`,
            [
                orderId,
                agent_id,
                assignmentType,
                req.user.id
            ]
        );

        // 10. Update current assigned agent
        await connection.execute(
            `UPDATE orders
             SET assigned_agent_id = ?
             WHERE id = ?`,
            [
                agent_id,
                orderId
            ]
        );

        // 11. Agent becomes busy
        await connection.execute(
            `UPDATE agent_profiles
             SET availability_status = 'BUSY'
             WHERE user_id = ?`,
            [agent_id]
        );

        // 12. Add tracking history
        await connection.execute(
            `INSERT INTO order_tracking_history
            (
                order_id,
                status,
                changed_by,
                notes
            )
            VALUES (?, 'PLACED', ?, ?)`,
            [
                orderId,
                req.user.id,
                `Order assigned to agent ${agent.name}`
            ]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Order assigned successfully",
            orderId: Number(orderId),
            agentId: Number(agent_id),
            assignmentType,
            status: "PLACED"
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

const updateOrderStatus = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { status, notes } = req.body;

        const allowedStatuses = [
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        // 1. Get order
        const [orders] = await connection.execute(
            `SELECT
                id,
                customer_id,
                assigned_agent_id,
                payment_type,
                cod_amount,
                cod_collected,
                status
             FROM orders
             WHERE id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        // 2. Make sure this agent is assigned to the order
        if (order.assigned_agent_id !== req.user.id) {
            return res.status(403).json({
                message: "You are not assigned to this order"
            });
        }

        // 3. Validate status transition
        const validTransitions = {
            PLACED: ["PICKED_UP"],
            PICKED_UP: ["IN_TRANSIT"],
            IN_TRANSIT: ["OUT_FOR_DELIVERY"],
            OUT_FOR_DELIVERY: ["DELIVERED", "RESCHEDULED"],
            RESCHEDULED: ["OUT_FOR_DELIVERY"]
        };

        if (
            !validTransitions[order.status] ||
            !validTransitions[order.status].includes(status)
        ) {
            return res.status(400).json({
                message: `Cannot change order status from ${order.status} to ${status}`
            });
        }

        if (status === "DELIVERED" && order.payment_type === "COD") {
            if (!order.cod_collected) {
                return res.status(400).json({
                    message: "COD amount must be collected before marking the order as delivered"
                });
            }
        }


        // 4. Update order status
        await connection.execute(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            [
                status,
                orderId
            ]
        );

        // 5. Add tracking history
        await connection.execute(
            `INSERT INTO order_tracking_history
            (
                order_id,
                status,
                changed_by,
                notes
            )
            VALUES (?, ?, ?, ?)`,
            [
                orderId,
                status,
                req.user.id,
                notes || null
            ]
        );

        const [customerUsers] = await connection.execute(
            `SELECT email
            FROM users
            WHERE id = ?`,
            [order.customer_id]
        );

        if (customerUsers.length > 0) {
            await createNotification({
                userId: order.customer_id,
                orderId,
                eventType: "STATUS_CHANGED",
                recipient: customerUsers[0].email,
                message: `Your order #${orderId} status has been updated to ${status}.`,
                connection
            });
        }

        // 6. If delivered, make agent available again
        
        if (status === "DELIVERED") {
            await connection.execute(
                `UPDATE agent_profiles
                 SET availability_status = 'AVAILABLE'
                 WHERE user_id = ?`,
                [req.user.id]
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: "Order status updated successfully",
            orderId: Number(orderId),
            previousStatus: order.status,
            currentStatus: status
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

const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Check that the order exists
        const [orders] = await pool.execute(
            `SELECT
                id,
                customer_id,
                assigned_agent_id,
                status,
                created_at,
                updated_at
             FROM orders
             WHERE id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        // Customers can only track their own orders
        if (
            req.user.role === "CUSTOMER" &&
            order.customer_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        // Agents can only track orders assigned to them
        if (
            req.user.role === "AGENT" &&
            order.assigned_agent_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const [tracking] = await pool.execute(
            `SELECT
                id,
                status,
                changed_by,
                notes,
                created_at
             FROM order_tracking_history
             WHERE order_id = ?
             ORDER BY created_at ASC, id ASC`,
            [orderId]
        );

        return res.status(200).json({
            orderId: order.id,
            currentStatus: order.status,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            tracking
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


const rescheduleOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { orderId } = req.params;
        const { new_delivery_date, reason } = req.body;

        // 1. Validate input
        if (!new_delivery_date) {
            return res.status(400).json({
                message: "new_delivery_date is required"
            });
        }

        const newDeliveryDate = new Date(new_delivery_date);

        if (Number.isNaN(newDeliveryDate.getTime())) {
            return res.status(400).json({
                message: "Invalid delivery date"
            });
        }

        if (newDeliveryDate <= new Date()) {
            return res.status(400).json({
                message: "New delivery date must be in the future"
            });
        }

        // 2. Get order
        const [orders] = await connection.execute(
            `SELECT
                id,
                customer_id,
                assigned_agent_id,
                status
             FROM orders
             WHERE id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        // 3. Check permissions
        if (
            req.user.role === "CUSTOMER" &&
            order.customer_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        if (
            req.user.role === "AGENT" &&
            order.assigned_agent_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        // 4. Cannot reschedule completed/cancelled orders
        if (
            order.status === "DELIVERED" ||
            order.status === "CANCELLED"
        ) {
            return res.status(400).json({
                message: `Order cannot be rescheduled from ${order.status} status`
            });
        }

        // 5. Get previous attempt date
        const previousAttemptDate = new Date();

        // 6. Create reschedule record
        await connection.execute(
            `INSERT INTO reschedules
            (
                order_id,
                previous_attempt_date,
                new_delivery_date,
                reason,
                requested_by
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                orderId,
                previousAttemptDate,
                newDeliveryDate,
                reason || null,
                req.user.id
            ]
        );

        // 7. Update order status
        await connection.execute(
            `UPDATE orders
             SET status = 'RESCHEDULED'
             WHERE id = ?`,
            [orderId]
        );

        // 8. Add tracking history
        await connection.execute(
            `INSERT INTO order_tracking_history
            (
                order_id,
                status,
                changed_by,
                notes
            )
            VALUES (?, 'RESCHEDULED', ?, ?)`,
            [
                orderId,
                req.user.id,
                reason || "Order rescheduled"
            ]
        );

        // 9. If an agent requested it, make them available
        if (req.user.role === "AGENT") {
            await connection.execute(
                `UPDATE agent_profiles
                 SET availability_status = 'AVAILABLE'
                 WHERE user_id = ?`,
                [req.user.id]
            );
        }

        const [customerUsers] = await connection.execute(
            `SELECT email
            FROM users
            WHERE id = ?`,
            [order.customer_id]
        );

        if (customerUsers.length > 0) {
            await createNotification({
                userId: order.customer_id,
                orderId,
                eventType: "RESCHEDULED",
                recipient: customerUsers[0].email,
                message: `Your order #${orderId} has been rescheduled. New delivery date: ${new_delivery_date}.`,
                connection
            });
        }

        await connection.commit();

        return res.status(200).json({
            message: "Order rescheduled successfully",
            orderId: Number(orderId),
            previousStatus: order.status,
            currentStatus: "RESCHEDULED",
            newDeliveryDate: newDeliveryDate
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

const collectCod = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { orderId } = req.params;

        const [orders] = await connection.execute(
            `SELECT
                id,
                customer_id,
                assigned_agent_id,
                payment_type,
                cod_amount,
                cod_collected,
                status
             FROM orders
             WHERE id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        // Must be a COD order
        if (order.payment_type !== "COD") {
            return res.status(400).json({
                message: "This order is not a COD order"
            });
        }

        // Must be assigned to this agent
        if (
            req.user.role === "AGENT" &&
            order.assigned_agent_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "This order is not assigned to you"
            });
        }

        // Must be out for delivery
        if (order.status !== "OUT_FOR_DELIVERY") {
            return res.status(400).json({
                message: "COD can only be collected when order is out for delivery"
            });
        }

        // Prevent duplicate collection
        if (order.cod_collected) {
            return res.status(400).json({
                message: "COD amount has already been collected"
            });
        }

        // Mark COD as collected
        await connection.execute(
            `UPDATE orders
             SET
                cod_collected = 1,
                cod_collected_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [orderId]
        );

        await connection.commit();

        return res.status(200).json({
            message: "COD amount collected successfully",
            orderId: Number(orderId),
            codAmount: Number(order.cod_amount),
            codCollected: true
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

module.exports = {
    createOrder,
    getOrders,
    assignOrder,
    updateOrderStatus,
    getOrderTracking,
    rescheduleOrder,
    collectCod
};