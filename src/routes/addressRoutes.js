const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createAddress,
    getMyAddresses
} = require("../controllers/addressController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("CUSTOMER"),
    createAddress
);

router.get(
    "/",
    authenticate,
    authorize("CUSTOMER"),
    getMyAddresses
);

module.exports = router;