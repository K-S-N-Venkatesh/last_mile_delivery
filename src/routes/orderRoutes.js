const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createOrder,
    getOrders,
    assignOrder,
    updateOrderStatus,
    getOrderTracking,
    rescheduleOrder,
    collectCod
} = require("../controllers/orderController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("CUSTOMER", "ADMIN"),
    createOrder
);

router.get(
    "/",
    authenticate,
    authorize("CUSTOMER", "ADMIN"),
    getOrders
);

router.patch(
    "/:orderId/assign",
    authenticate,
    authorize("ADMIN"),
    assignOrder
);

router.patch(
    "/:orderId/status",
    authenticate,
    authorize("AGENT"),
    updateOrderStatus
);

router.get(
    "/:orderId/tracking",
    authenticate,
    authorize("CUSTOMER", "AGENT", "ADMIN"),
    getOrderTracking
);

router.post(
    "/:orderId/reschedule",
    authenticate,
    authorize("CUSTOMER", "AGENT", "ADMIN"),
    rescheduleOrder
);

router.post(
    "/:orderId/cod-collect",
    authenticate,
    authorize("AGENT", "ADMIN"),
    collectCod
);

module.exports = router;
