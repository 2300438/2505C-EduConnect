const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3001; 

// Middleware
app.use(cors()); 
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, profile } = req.body;

        // 1. Input Validation to prevent server crashes
        if (!message) {
            return res.status(400).json({ reply: "Message is required." });
        }

        // 2. Safe fallbacks in case the frontend doesn't send the profile yet
        const userName = profile?.name || "Student";
        const userRole = profile?.role || "User";
        const userCourses = profile?.courses?.join(", ") || "No courses listed";

        const systemPrompt = `
            You are the EduConnect AI Assistant for ${userName} (${userRole}).
            Enrolled: ${userCourses}.
            STRICT RULES: Be concise. Address user by name once. Focus on ICT2503/4/5.
        `;

        // 3. Use the native systemInstruction property
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(message);
        
        // 4. Await is not needed here
        const response = result.response;
        
        res.json({ reply: response.text() });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Connection to AI failed. Check server logs." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 EduConnect Server running on http://localhost:${PORT}`);
});