const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Subtopic } = require("../models");

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 2. Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

router.post("/chat", async (req, res) => {
    const { message, subtopicId, history } = req.body;

    try {
        let knowledgeContext = "";

        // 1. If we have a subtopicId, go get the "Learned" text from the DB
        if (subtopicId) {
            const subtopic = await Subtopic.findByPk(subtopicId);
            if (subtopic && subtopic.extracted_text) {
                knowledgeContext = subtopic.extracted_text;
                console.log(`Using context from Subtopic: ${subtopic.title} (${knowledgeContext.length} chars)`);
            }
        }

        // 2. Construct the Gemini Prompt with the Context
        const prompt = `
            You are a helpful AI Tutor for EduConnect.
            
            KNOWLEDGE BASE (Use this to answer):
            ${knowledgeContext || "No specific document context provided for this lesson."}

            USER QUESTION: ${message}
            
            INSTRUCTIONS: 
            If the answer is in the Knowledge Base, explain it clearly. 
            If not, use your general knowledge but mention it wasn't in the lesson material.
        `;

        // 3. Call Gemini (using your existing genAI setup)
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        res.json({ reply: aiResponse });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "I'm having trouble accessing my brain right now." });
    }
});

module.exports = router;