const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const protect = require("../middleware/authMiddleware.js");

const router = express.Router();

/* Test Protect Route */
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "You are authenticated",
    user: req.user,
  });
});

/* Registration Route */
router.post("/register", async (req, res) => {
  try {
    console.log("1. Route Reached");

    const { name, email, password } = req.body;

    console.log("2. Got request data");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password required",
      });
    }

    console.log("3. Checkgin for existing user");

    const existingUser = await User.findOne({ email });

    console.log("4. Checked existing user");

    if (existingUser) {
      return res.status(400).json({
        message: "A user with that name already exists",
      });
    }
    console.log("5. Creating a hashed password");

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("6. Password hashed");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("7. User Created");

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("8. Token Created");

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(500).json({
      message: "Server Error.",
    });
  }
});

/* Login Route */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email or Password are required",
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email of password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
