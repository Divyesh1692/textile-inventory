require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/authRoutes");
const partyRoutes = require("./src/routes/partyRoutes");
const firmRoutes = require("./src/routes/firmRoutes");
const designRoutes = require("./src/routes/designRoutes");
const stockRoutes = require("./src/routes/stockRoutes");
const challanRoutes = require("./src/routes/challanRoutes");
const billRoutes = require("./src/routes/billRoutes");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

// Routes
app.use("/api/users", authRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/firm", firmRoutes);
app.use("/api/design", designRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/challan", challanRoutes);
app.use("/api/bill", billRoutes);
app.listen(process.env.PORT || 5050, () =>
  console.log("Server running on", process.env.PORT || 5050),
);
