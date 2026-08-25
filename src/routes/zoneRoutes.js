const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createZone,
    getZones
} = require("../controllers/zoneController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createZone
);

router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    getZones
);


module.exports = router;