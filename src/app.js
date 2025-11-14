const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const authRouter = require("./routes/auth");
const connectDB = require("./config/database");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", authRouter);
app.get("/test", (req, res) => {
  res.send("Server is running on PORT 7777");
});

// Connect DB
connectDB();

// Start server
app.listen(7777, () => {
  console.log("App is listening on port 7777");
});
