const express = require("express");
const yup = require("yup");
const { User } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.get("/:id", validateToken, async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "fullName", "email", "role", "bio", "profileImage", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve profile." });
  }
});

const updateProfileSchema = yup.object({
  fullName: yup.string().trim().min(2).max(100).required(),
  bio: yup.string().trim().max(1000).nullable(),
  profileImage: yup.string().trim().url().nullable(),
});

router.put("/:id", validateToken, async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const data = await updateProfileSchema.validate(req.body, { abortEarly: false });

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.update(data);

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Profile update failed.",
      errors: error.errors || [error.message],
    });
  }
});

module.exports = router;