const express = require("express");
const yup = require("yup");
const { Course, User } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: "instructor",
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "instructor",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course." });
  }
});

const courseSchema = yup.object({
  title: yup.string().trim().min(3).max(150).required(),
  description: yup.string().trim().min(10).required(),
  category: yup.string().trim().max(100).nullable(),
  thumbnail: yup.string().trim().url().nullable(),
});

router.post("/", validateToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Only instructors can create courses." });
    }

    const data = await courseSchema.validate(req.body, { abortEarly: false });

    const course = await Course.create({
      ...data,
      instructorId: req.user.id,
    });

    res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    res.status(400).json({
      message: "Course creation failed.",
      errors: error.errors || [error.message],
    });
  }
});

module.exports = router;