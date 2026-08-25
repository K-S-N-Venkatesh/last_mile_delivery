const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createArea,
    getAreasByZone
} = require("../controllers/areaController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createArea
);

router.get(
    "/zone/:zoneId",
    authenticate,
    authorize("ADMIN"),
    getAreasByZone
);

module.exports = router;