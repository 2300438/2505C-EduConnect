const express = require("express");
const router = express.Router();
const { SupportTicket } = require("../models");
const validateToken = require("../middleware/validateToken");

// PUBLIC: anyone can submit a ticket
router.post("/submit", async (req, res) => {
  try {
    const { fullName, email, subject, message, category, userId } = req.body;

    const newTicket = await SupportTicket.create({
      userId: userId || null,
      fullName,
      email,
      category,
      subject,
      message,
      status: "open",
    });

    res.json({
      success: true,
      message: `Ticket #${newTicket.id} created! Our analysts will review it soon.`,
      ticketId: newTicket.id,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Failed to submit ticket." });
  }
});

// PROTECTED: student/instructor can view own tickets
router.get("/my-tickets", validateToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching my tickets:", error);
    res.status(500).json({ message: "Error fetching your tickets." });
  }
});

// INSTRUCTOR: view all tickets
router.get("/all", validateToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const allTickets = await SupportTicket.findAll({
      order: [["status", "ASC"], ["createdAt", "DESC"]],
    });

    res.json(allTickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ message: "Error fetching all tickets." });
  }
});

// INSTRUCTOR: update ticket status
router.patch("/update/:id", validateToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const { status } = req.body;

    await SupportTicket.update(
      { status },
      { where: { id: req.params.id } }
    );

    res.json({ success: true, message: "Ticket status updated." });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Error updating ticket." });
  }
});

module.exports = router;