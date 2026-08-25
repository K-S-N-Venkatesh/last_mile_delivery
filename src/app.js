require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/authRoutes");
const zoneRoutes = require("./routes/zoneRoutes");
const areaRoutes = require("./routes/areaRoutes");
const rateCardRoutes = require("./routes/rateCardRoutes");
const codRoutes = require("./routes/codRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/rate-cards", rateCardRoutes);
app.use("/api/cod-rates", codRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Last-Mile Delivery Tracker API"
    });
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});