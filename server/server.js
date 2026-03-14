const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { handleUpload } = require('@vercel/blob/client');

// --- 1. ADD THESE SPECIFIC IMPORTS ---
const { sequelize, User, Course, Topic, Subtopic } = require("./models");
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

// --- VERCEL BLOB UPLOAD ROUTE ---
app.post('/api/upload', async (req, res) => {
    try {
        const jsonResponse = await handleUpload({
            body: req.body,
            request: req,
            onBeforeGenerateToken: async (pathname) => {
                return {
                    allowedContentTypes: [
                        'video/*',
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    ],
                    // Keep the 500MB size limit and extended timeout
                    maximumSizeInBytes: 500 * 1024 * 1024,
                    validUntil: Date.now() + 600000,
                };
            },

            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('Vercel webhook confirmed upload for:', blob.url);
            }
        });

        return res.status(200).json(jsonResponse);
    } catch (error) {
        console.error("Vercel Blob Upload Error:", error);
        return res.status(400).json({ error: error.message });
    }
});

// --- YOUR GEMINI AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Add the protector to the route
app.post('/api/chat', protect, async (req, res) => {
    try {
        const { message, history = [], page = "unknown", courseId = null } = req.body;

        if (!message) {
            return res.status(400).json({ reply: "Message is required." });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ reply: "User not found in database." });
        }

        let courseContext = "";

        if (courseId) {
            const course = await Course.findByPk(courseId, {
                include: [
                    {
                        model: Topic,
                        as: "topics",
                        include: [
                            {
                                model: Subtopic,
                                as: "subtopics"
                            }
                        ]
                    }
                ]
            });

            if (course) {
                const topicSummary = (course.topics || [])
                    .map((topic, topicIndex) => {
                        const subtopicList = (topic.subtopics || [])
                            .map((sub, subIndex) => `${topicIndex + 1}.${subIndex + 1} ${sub.title}`)
                            .join(", ");

                        return `Topic ${topicIndex + 1}: ${topic.title}${subtopicList ? ` | Subtopics: ${subtopicList}` : ""}`;
                    })
                    .join("\n");

                courseContext = `
                Current course:
                Title: ${course.title}
                Description: ${course.description}
                ${topicSummary}
                `.trim();
            }
        }

        const systemPrompt = `
        You are the EduConnect AI Assistant.

        User name: ${user.fullName}
        User role: ${user.role}
        Current page: ${page}

        ${courseContext}

        Rules:
        - Keep replies short and easy to read.
        - Default to 3 to 5 lines only.
        - Prefer short bullet points.
        - If course context is provided, use it.
        - If the user asks about this course, answer using the course title, description, topics, and subtopics.
        - Do not invent missing course details.
        - Only give more detail if the user asks for it.
        - For students, explain simply.
        - For instructors, be practical and concise.
        - Do not use markdown symbols like **, *, #, or - for formatting.
        - Use plain simple sentences.
        `.trim();

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: systemPrompt
        });

        const contents = [];

        history.slice(-8).forEach((msg) => {
            contents.push({
                role: msg.role === "ai" ? "model" : "user",
                parts: [{ text: msg.text }]
            });
        });

        if (!history.length || history[history.length - 1]?.text !== message) {
            contents.push({
                role: "user",
                parts: [{ text: message }]
            });
        }

        const result = await model.generateContent({ contents });
        res.json({ reply: result.response.text() });

    } catch (error) {
    console.error("AI Error:", error);

    if (error.status === 429) {
        return res.status(429).json({
            reply: "AI usage limit reached for now. Please wait a moment and try again."
        });
    }

    res.status(500).json({
        reply: "Connection to AI failed."
    });
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