const pool = require("../config/db");

const calculateWeights = (
    length_cm,
    width_cm,
    height_cm,
    actual_weight_kg
) => {
    const volumetric_weight_kg =
        (length_cm * width_cm * height_cm) / 5000;

    const chargeable_weight_kg = Math.max(
        actual_weight_kg,
        volumetric_weight_kg
    );

    return {
        volumetric_weight_kg,
        chargeable_weight_kg
    };
};

const determineRateType = (pickupZoneId, deliveryZoneId) => {
    if (pickupZoneId === deliveryZoneId) {
        return "INTRA_ZONE";
    }

    return "INTER_ZONE";
};

const findRateCard = async (
    customerType,
    rateType,
    chargeableWeight
) => {

    const [rates] = await pool.execute(
        `SELECT id, rate
         FROM rate_cards
         WHERE customer_type = ?
           AND rate_type = ?
           AND min_weight < ?
           AND max_weight >= ?
           AND status = 'ACTIVE'
         ORDER BY min_weight ASC
         LIMIT 1`,
        [
            customerType,
            rateType,
            chargeableWeight,
            chargeableWeight
        ]
    );

    if (rates.length === 0) {
        throw new Error(
            "No active rate card found for the given weight"
        );
    }

    return rates[0];
};

const calculateCodSurcharge = async (
    customerType,
    paymentType,
    deliveryCharge
) => {

    // No COD surcharge for prepaid orders
    if (paymentType !== "COD") {
        return 0;
    }

    const [rates] = await pool.execute(
        `SELECT surcharge_type, surcharge_value
         FROM cod_rates
         WHERE customer_type = ?
           AND status = 'ACTIVE'
         ORDER BY id DESC
         LIMIT 1`,
        [customerType]
    );

    if (rates.length === 0) {
        throw new Error(
            "No active COD rate found for this customer type"
        );
    }

    const codRate = rates[0];

    if (codRate.surcharge_type === "FIXED") {
        return Number(codRate.surcharge_value);
    }

    if (codRate.surcharge_type === "PERCENTAGE") {
        return (
            deliveryCharge *
            Number(codRate.surcharge_value) /
            100
        );
    }

    throw new Error("Invalid COD surcharge type");
};

const calculateOrderPrice = async ({
    pickupZoneId,
    deliveryZoneId,
    customerType,
    paymentType,
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg
}) => {

    // 1. Calculate weights
    const {
        volumetric_weight_kg,
        chargeable_weight_kg
    } = calculateWeights(
        lengthCm,
        widthCm,
        heightCm,
        actualWeightKg
    );

    // 2. Determine INTRA / INTER
    const rateType = determineRateType(
        pickupZoneId,
        deliveryZoneId
    );

    // 3. Find applicable rate card
    const rateCard = await findRateCard(
        customerType,
        rateType,
        chargeable_weight_kg
    );

    // 4. Delivery charge
    const deliveryCharge = Number(rateCard.rate);

    // 5. COD surcharge
    const codSurcharge = await calculateCodSurcharge(
        customerType,
        paymentType,
        deliveryCharge
    );

    // 6. Total
    const totalCharge =
        deliveryCharge + codSurcharge;

    return {
        volumetric_weight_kg,
        chargeable_weight_kg,
        rateType,
        rateCardId: rateCard.id,
        deliveryCharge,
        codSurcharge,
        totalCharge
    };
};

module.exports = {
    calculateWeights,
    determineRateType,
    findRateCard,
    calculateCodSurcharge,
    calculateOrderPrice
};