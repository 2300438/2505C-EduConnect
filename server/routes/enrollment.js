const express = require("express");
const { Enrollment, Course, Progress } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.post("/", validateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can enroll in courses." });
    }

    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const existingEnrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId,
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: "Student already enrolled in this course." });
    }

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      status: "active",
    });

    await Progress.create({
      userId: req.user.id,
      courseId,
      progressPercent: 0,
      lastAccessedAt: new Date(),
    });

    res.status(201).json({
      message: "Enrollment successful.",
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ message: "Failed to enroll in course." });
  }
});

router.get("/my-courses", validateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { userId: req.user.id },
      include: [Course],
    });

    res.json(enrollments);
  } catch (error) {
    console.error("Fetch enrollments error:", error);
    res.status(500).json({ message: "Failed to fetch enrolled courses." });
  }
});

module.exports = router;