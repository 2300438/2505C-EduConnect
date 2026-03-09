const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 1. ADD THESE SPECIFIC IMPORTS ---
const { sequelize, User } = require("./models"); 
const protect = require("./middleware/validateToken"); 
// --------------------------------------

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/courses");
const dashboardRoutes = require("./routes/dashboard");
const enrollmentRoutes = require("./routes/enrollment");
const progressRoutes = require("./routes/progress");

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({ message: "EduConnect backend running." });
});

// --- YOUR GEMINI AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Add the protector to the route
app.post('/api/chat', protect, async (req, res) => { 
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ reply: "Message is required." });
        }
        
        // Use req.user which is populated by the validateToken middleware
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ reply: "User not found in database." });
        }

        // 3. Use REAL data from your MySQL columns (fullName, role)
        const systemPrompt = `
            You are the EduConnect AI Assistant for ${user.fullName}.
            Your role is to assist this ${user.role} with their ICT studies.
            STRICT RULES: Be concise. Address them as ${user.fullName} once. Focus on ICT2503/4/5.
        `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(message);
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Connection to AI failed." });
    }
});

// --- DB SYNC & SERVER START ---
sequelize.sync({ alter: true })
    .then(() => {
        console.log("Database synced successfully.");
        app.listen(PORT, () => {
            console.log(`🚀 EduConnect Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
    });