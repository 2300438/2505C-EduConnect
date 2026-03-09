const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
<<<<<<< HEAD
const { sequelize } = require("./models");
=======

// --- 1. ADD THESE SPECIFIC IMPORTS ---
const { sequelize, User } = require("./models"); // Added 'User' here
const protect = require("./middleware/validateToken"); // Added this import
// --------------------------------------

>>>>>>> main
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/courses");
const dashboardRoutes = require("./routes/dashboard");
const enrollmentRoutes = require("./routes/enrollment");
const progressRoutes = require("./routes/progress");

const app = express();
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
// Middleware
app.use(cors());
app.use(express.json());
=======
// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- COLLEAGUE'S API ROUTES ---
>>>>>>> main
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);

<<<<<<< HEAD
// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test route
app.get("/", (req, res) => {
    res.json({ message: "EduConnect backend running." });
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, profile } = req.body;

        if (!message) {
            return res.status(400).json({ reply: "Message is required." });
        }

        const userName = profile?.name || "Student";
        const userRole = profile?.role || "User";
        const userCourses = profile?.courses?.join(", ") || "No courses listed";

        const systemPrompt = `
            You are the EduConnect AI Assistant for ${userName} (${userRole}).
            Enrolled: ${userCourses}.
            STRICT RULES: Be concise. Address user by name once. Focus on ICT2503/4/5.
        `;

        const model = genAI.getGenerativeModel({
=======
// --- YOUR GEMINI AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Add the protector to the route
app.post('/api/chat', protect, async (req, res) => { 
    try {
        const { message } = req.body;
        
        // Use req.user which is populated by your colleague's validateToken
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ reply: "User not found in database." });
        }

        // 3. Use REAL data from your MySQL columns (fullName, role)
        const systemPrompt = `
            You are the EduConnect AI Assistant for ${user.fullName}.
            Your role is to assist this ${user.role} with their ICT studies.
            STRICT RULES: Be concise. Address them as ${user.fullName} once.
        `;

        const model = genAI.getGenerativeModel({ 
>>>>>>> main
            model: "gemini-2.5-flash-lite",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(message);
<<<<<<< HEAD
        const response = result.response;

        res.json({ reply: response.text() });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Connection to AI failed. Check server logs." });
    }
});

// Start server only after DB connects
sequelize.sync({ alter: true })
    .then(() => {
        console.log("Database synced.");
=======
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Connection to AI failed." });
    }
});

// --- COLLEAGUE'S DB SYNC & SERVER START ---

sequelize.sync({ alter: true })
    .then(() => {
        console.log("Database synced successfully.");
>>>>>>> main
        app.listen(PORT, () => {
            console.log(`🚀 EduConnect Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });