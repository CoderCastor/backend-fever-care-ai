const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

// Patient Signup
authRouter.post("/signup/patient", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: "Email already registered" 
      });
    }

    // Encrypt password
    const hashPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashPass,
      role: "patient" // Assign patient role
    });

    const savedUser = await user.save();

    // Generate JWT token with role
    const token = jwt.sign(
      { 
        userId: savedUser._id, 
        email: savedUser.email,
        role: savedUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    

    res.json({
      success: true,
      message: "Patient registered successfully!",
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        token:token
      }
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Clinician Signup
authRouter.post("/signup/clinician", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: "Email already registered" 
      });
    }

    // Encrypt password
    const hashPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashPass,
      role: "clinician" // Assign clinician role
    });

    const savedUser = await user.save();

    // Generate JWT token with role
    const token = jwt.sign(
      { 
        userId: savedUser._id, 
        email: savedUser.email,
        role: savedUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    

    res.json({
      success: true,
      message: "Clinician registered successfully!",
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        token:token
      }
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Patient Login
// Patient Login
authRouter.post("/login/patient", async (req, res) => {
  try {
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Email"
      });
    }

    // ✅ ADD .select('+password') to include password field
    const user = await User.findOne({ email: email, role: "patient" })
      .select('+password');

    console.log("User found:", user ? "Yes" : "No");
    console.log("User password hash:", user?.password ? "Present" : "Missing");

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials or not a patient account"
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Patient login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Clinician Login
authRouter.post("/login/clinician", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Email"
      });
    }

    // ✅ ADD .select('+password') here too
    const user = await User.findOne({ email: email, role: "clinician" })
      .select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials or not a clinician account"
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Clinician login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});


// Logout Route (common for both)
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.json({ 
    success: true,
    message: "Logout successful" 
  });
});

module.exports = authRouter;
