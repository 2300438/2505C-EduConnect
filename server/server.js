const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sequelize } = require("./models");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/courses");
const dashboardRoutes = require("./routes/dashboard");
const enrollmentRoutes = require("./routes/enrollment");
const progressRoutes = require("./routes/progress");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);

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
            model: "gemini-2.5-flash-lite",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(message);
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
        app.listen(PORT, () => {
            console.log(`🚀 EduConnect Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });