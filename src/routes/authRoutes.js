const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const router = express.Router();

const {
    registerCustomer,
    registerAgent,
    verifyAgent,
    updateAgentAvailability,
    login
} = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/register/agent", registerAgent);
router.post("/login", login);

router.patch(
    "/agents/:agentId/verify",
    authenticate,
    authorize("ADMIN"),
    verifyAgent
);

router.patch(
    "/agents/availability",
    authenticate,
    authorize("AGENT"),
    updateAgentAvailability
);

module.exports = router;