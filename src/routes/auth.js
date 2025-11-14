const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken"); // Add this import

// Signup Route
authRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Encrypt password
    const hashPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashPass,
    });

    const savedUser = await user.save();
    
    // Generate JWT token directly here
    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 8 * 3600000),
    });

    res.json({ 
      message: "User Added successfully!", 
      data: savedUser 
    });
  } catch (err) {
    res.status(400).send("Some Error Occured " + err.message);
  }
});

// Login Route
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
      throw new Error("Invalid Email");
    }

    // Find user by email
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("Invalid Credentials");
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // Generate JWT token directly here
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      // Add the token to cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 8 * 3600 * 1000,
      });

      res.send(user);
    } else {
      throw new Error("Invalid Credentials");
    }
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// Logout Route
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("LogOut Successful!!");
});

module.exports = authRouter;
