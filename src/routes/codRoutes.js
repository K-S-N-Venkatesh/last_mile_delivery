const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createCodRate
} = require("../controllers/codController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createCodRate
);

module.exports = router;