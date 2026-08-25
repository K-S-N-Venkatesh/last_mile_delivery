const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createRateCard,
    getRateCards,
    updateRateCard,
    updateRateCardStatus
} = require("../controllers/rateCardController");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    createRateCard
);

router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    getRateCards
);

router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    updateRateCard
);

router.patch(
    "/:id/status",
    authenticate,
    authorize("ADMIN"),
    updateRateCardStatus
)
module.exports = router;