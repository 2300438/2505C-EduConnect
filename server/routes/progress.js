const express = require("express");
// Make sure to import Topic and Subtopic so we can count them!
const { Progress, Course, Topic, Subtopic, Enrollment } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

// --- GET ALL PROGRESS FOR LOGGED IN USER ---
router.get("/", validateToken, async (req, res) => {
  try {
    const progress = await Progress.findAll({
      where: { userId: req.user.id },
      include: [Course],
    });

    res.json(progress);
  } catch (error) {
    console.error("Fetch progress error:", error);
    res.status(500).json({ message: "Failed to fetch progress." });
  }
});

// --- SECURE PUT: UPDATE PROGRESS BY SUBTOPIC ID ---
router.put("/:courseId", validateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const userId = req.user.id;
    
    // 1. Force the subtopicId to be a number so .includes() works perfectly
    const incomingSubtopicId = parseInt(req.body.subtopicId, 10);

    if (!incomingSubtopicId) {
      return res.status(400).json({ message: "subtopicId is required." });
    }

    // 2. Verify the user is enrolled and approved
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId, status: "approved" }
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled or approved." });
    }

    // 3. Find or create the progress record
    let progress = await Progress.findOne({
      where: { userId, courseId }
    });

    if (!progress) {
      progress = await Progress.create({
        userId,
        courseId,
        progressPercent: 0,
        lastAccessedAt: new Date(),
        completedSubtopics: [] 
      });
    }

    // 4. Update last accessed date
    progress.lastAccessedAt = new Date();

    // 5. Calculate total subtopics in the entire course
    const courseTopics = await Topic.findAll({
      where: { courseId },
      include: [{ model: Subtopic, as: "subtopics" }]
    });

    let totalSubtopics = 0;
    courseTopics.forEach(topic => {
      totalSubtopics += topic.subtopics.length;
    });

    // 6. FIX: Create a brand new array copy so Sequelize detects the change
    let completed = [...(progress.completedSubtopics || [])];
    
    // 7. Check and Push
    if (!completed.includes(incomingSubtopicId)) {
      completed.push(incomingSubtopicId);
      progress.completedSubtopics = completed;
      
      // FIX: Explicitly tell Sequelize that this JSON column was modified!
      progress.changed('completedSubtopics', true);
      
      // Calculate new percentage
      if (totalSubtopics > 0) {
        progress.progressPercent = Math.round((completed.length / totalSubtopics) * 100);
      }
    }

    // Cap at 100% just to be safe
    if (progress.progressPercent > 100) progress.progressPercent = 100;

    await progress.save();

    // Return the updated progress object so you can see the results
    res.json({
      message: "Progress updated successfully.",
      progress: progress
    });

  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({ message: "Failed to update progress." });
  }
});

module.exports = router;