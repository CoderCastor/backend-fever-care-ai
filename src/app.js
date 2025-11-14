const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth");
const mlRouter = require("./routes/ml");
const patientRouter = require("./routes/patient");
const connectDB = require("./config/database");
const auth = require("./middlewares/auth");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
app.use("/ml", mlRouter);
app.use("/", authRouter);
app.use("/patient", auth, patientRouter);
app.get("/test", (req, res) => {
  res.send("Server is running on PORT 7777");
});

connectDB()
  .then(() => {
    console.log("✅ Database connection Established.");
    app.listen(7777, () => {
      console.log("✅ Node.js server listening on port 7777");
      console.log(" - Main API: http://localhost:7777");
      console.log(" - ML API (Flask): http://localhost:5000");
    });
  })
  .catch((err) => {
    console.log("❌ Database Connection Failed..." + err);
  });
