const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const yup = require("yup");
const { User } = require("../models");
const sendResetEmail = require('../utils/mailer');
const crypto = require('node:crypto');
const { Op } = require("sequelize");

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

// 1. THIS IS THE FIX: Added 'role' to the login validation schema
const loginSchema = yup.object({
  email: yup.string().trim().email().required(),
  password: yup.string().required(),
  role: yup.string().oneOf(["student", "instructor"]).required(), 
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

    // 2. THIS IS THE FIX: Check if the requested role matches the database
    if (user.role !== data.role) {
      return res.status(403).json({ 
        message: `Account found, but you are registered as a ${user.role}. Please switch tabs.` 
      });
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

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        
        // Security Note: Don't tell the user if the email doesn't exist
        if (!user) {
            return res.json({ message: "If an account exists, a link has been sent." });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour
        await user.save();

        // The URL the user clicks in their email
        const resetUrl = `http://localhost:3000/reset-password/${token}`;

        // FIRE THE EMAIL!
        await sendResetEmail(user.email, resetUrl);

        res.json({ message: "If an account exists, a link has been sent." });

    } catch (error) {
        console.error("Mail Error:", error);
        res.status(500).json({ message: "Error sending reset email." });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { [Op.gt]: Date.now() } // Must be in the future
            }
        });

        if (!user) return res.status(400).json({ message: "Token is invalid or expired." });

        // Hash new password and clear token fields
        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Reset failed." });
    }
});

module.exports = router;