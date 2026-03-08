const express = require('express');
const path = require('path');
require('dotenv').config();
console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
// This allows your HTML pages to find your CSS and JS correctly
app.use('/public', express.static(path.join(__dirname, 'public')));

// Initialize Gemini AI with your API Key from the .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ROUTES ---

// 1. AI Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { message, profile } = req.body; // Extract profile from request
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // DYNAMIC SYSTEM PROMPT
        const systemPrompt = `
            You are the EduConnect AI Assistant for ${profile.name} (${profile.role}).
            Enrolled: ${profile.courses.join(", ")}.

            STRICT RULES:
            1. Be extremely concise. No long welcomes.
            2. Address the user by name once.
            3. Do not list all courses in every response unless relevant to the answer.
            4. Focus on helping with ICT2503, ICT2504, or ICT2505 only when asked.
        `;

        const result = await model.generateContent(`${systemPrompt}\nUser Message: ${message}`);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "I'm having trouble connecting." });
    }
});

// 2. Page Routes (Serving your HTML files)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.listen(PORT, () => {
    console.log(`EduConnect is running! Visit http://localhost:${PORT}`);
});