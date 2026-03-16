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

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });

    // Check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      where: { userId: req.user.id, courseId },
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: "Enrollment request already exists." });
    }

    // CREATE PENDING ENROLLMENT ONLY
    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      status: "pending", //
    });

    res.status(201).json({ message: "Enrollment request submitted.", enrollment });
  } catch (error) {
    res.status(500).json({ message: "Failed to enroll." });
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