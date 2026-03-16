const express = require("express");
const { Course, Enrollment, Progress } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.get("/student/:id", validateToken, async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id || req.user.role !== "student") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const enrollments = await Enrollment.findAll({
      where: { userId: req.user.id },
      // THIS IS THE FIX: Added the exact alias defined in index.js
      include: [{
        model: Course,
        as: "course"
      }],
    });

    const progress = await Progress.findAll({
      where: { userId: req.user.id },
      // Progress doesn't have an alias in index.js, so this one is fine!
      include: [Course],
    });

    res.json({
      totalEnrolledCourses: enrollments.length,
      enrollments,
      progress,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch student dashboard." });
  }
});

router.get("/instructor/:id", validateToken, async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id || req.user.role !== "instructor") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
    });

    res.json({
      totalCoursesCreated: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Instructor dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch instructor dashboard." });
  }
});

module.exports = router;