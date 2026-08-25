const express = require("express");


const router = express.Router();

const {
    registerCustomer,
    login
} = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", login);


module.exports = router;