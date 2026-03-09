const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const yup = require("yup");
const { User } = require("../models");
require("dotenv").config();

const router = express.Router();

const registerSchema = yup.object({
  fullName: yup.string().trim().min(2).max(100).required(),
  email: yup.string().trim().email().required(),
  password: yup.string().min(6).max(50).required(),
  role: yup.string().oneOf(["student", "instructor"]).required(),
});

router.post("/register", async (req, res) => {
  try {
    const data = await registerSchema.validate(req.body, { abortEarly: false });

    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Validation or registration failed.",
      errors: error.errors || [error.message],
    });
  }
});

const loginSchema = yup.object({
  email: yup.string().trim().email().required(),
  password: yup.string().required(),
});

router.post("/login", async (req, res) => {
  try {
    const data = await loginSchema.validate(req.body, { abortEarly: false });

    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful.",
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Validation or login failed.",
      errors: error.errors || [error.message],
    });
  }
});

module.exports = router;