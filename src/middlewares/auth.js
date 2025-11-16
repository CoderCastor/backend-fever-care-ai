const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    // Extract token (format: "Bearer TOKEN")
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please login again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;

    // Optional: Verify user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ REMOVED isActive check since your User model doesn't have it

    // Attach user object to request (optional)
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

module.exports = auth;
