const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const router = express.Router();

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

module.exports = router;
