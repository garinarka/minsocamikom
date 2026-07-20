const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "minsocamikom-backend" });
});

app.use("/api/auth", require("./routes/auth.routes"));

// Route modules akan ditambahkan di fase berikutnya:
// app.use("/api/fields", require("./routes/field.routes"));
// app.use("/api/bookings", require("./routes/booking.routes"));
// app.use("/api/payments", require("./routes/payment.routes"));

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

module.exports = app;
