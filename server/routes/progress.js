const express = require("express");
const { Progress, Course } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

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

router.put("/:courseId", validateToken, async (req, res) => {
  try {
    const { progressPercent } = req.body;

    const progress = await Progress.findOne({
      where: {
        userId: req.user.id,
        courseId: req.params.courseId,
      },
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress record not found." });
    }

    await progress.update({
      progressPercent,
      lastAccessedAt: new Date(),
    });

    res.json({
      message: "Progress updated successfully.",
      progress,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({ message: "Failed to update progress." });
  }
});

module.exports = router;