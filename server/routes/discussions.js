const express = require("express");
const { DiscussionBoard, DiscussionPost, User } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

// --- GET ALL POSTS FOR A SPECIFIC BOARD ---
router.get("/:boardId/posts", validateToken, async (req, res) => {
  try {
    const { boardId } = req.params;

    // Verify the board exists
    const board = await DiscussionBoard.findByPk(boardId);
    if (!board) {
      return res.status(404).json({ message: "Discussion board not found." });
    }

    // Fetch all posts, including the name of the user who wrote them
    const posts = await DiscussionPost.findAll({
      where: { boardId },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "fullName", "role"], // We grab role so instructors can have a special badge!
        },
      ],
      order: [["createdAt", "ASC"]], // Oldest first, just like a normal chat app
    });

    res.json({ board, posts });
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({ message: "Failed to load discussion posts." });
  }
});

// --- POST A NEW REPLY TO A BOARD ---
router.post("/:boardId/posts", validateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Post content cannot be empty." });
    }

    // Save the new post to the database
    const newPost = await DiscussionPost.create({
      content,
      boardId,
      userId: req.user.id, // Pulled securely from the JWT token
    });

    // Fetch the post back immediately with the user's info attached so React can display it instantly
    const postWithUser = await DiscussionPost.findByPk(newPost.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "fullName", "role"],
        },
      ],
    });

    res.status(201).json(postWithUser);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Failed to submit post." });
  }
});

module.exports = router;