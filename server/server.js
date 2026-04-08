const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mysql = require('mysql2/promise');
const { handleUpload } = require('@vercel/blob/client');

// --- 1. ADD THESE SPECIFIC IMPORTS ---
const { sequelize, User, Course, Topic, Subtopic, SupportTicket, } = require("./models");
const protect = require("./middleware/validateToken");
// --------------------------------------

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/courses");
const dashboardRoutes = require("./routes/dashboard");
const enrollmentRoutes = require("./routes/enrollment");
const progressRoutes = require("./routes/progress");
const extractRoute = require('./routes/extract');
const discussionRoutes = require("./routes/discussions");
const supportRoutes = require("./routes/support");
const libraryRoutes = require('./routes/library');

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());


// --- API ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/discussions", discussionRoutes)
app.use(extractRoute);
app.use("/api/support", supportRoutes);
app.use('/api/library', libraryRoutes);

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

        // --- UPGRADE 1: Fetch the user's Bio and Enrolled Courses ---
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Course,
                as: 'enrolledCourses', // Matches the alias in your index.js
                attributes: ['title']
            }]
        });

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
                        include: [{ model: Subtopic, as: "subtopics" }]
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

                // --- NEW: FETCH THE ACTUAL SLIDE/PDF TEXT ---
                let extractedMaterials = "";
                try {
                    const connection = await mysql.createConnection({
                        host: process.env.DB_HOST,
                        user: process.env.DB_USER,
                        password: process.env.DB_PASSWORD,
                        database: process.env.DB_NAME,
                    });
                    
                    // Only fetch text where the instructor clicked "Add to AI Tutor"
                    const [contentRows] = await connection.execute(
                        'SELECT extracted_text FROM course_content WHERE course_id = ? AND is_ai_trained = TRUE',
                        [courseId]
                    );
                    
                    extractedMaterials = contentRows
                        .filter(row => row.extracted_text)
                        .map(row => row.extracted_text)
                        .join("\n\n--- NEXT DOCUMENT ---\n\n");
                        
                    await connection.end();
                } catch (dbErr) {
                    console.error("Failed to fetch extracted text:", dbErr);
                }
                // --------------------------------------------

                courseContext = `
                Current course the user is viewing:
                Title: ${course.title}
                Description: ${course.description}
                
                Course Outline:
                ${topicSummary}

                ACTUAL COURSE CONTENT FROM SLIDES & PDFs:
                """
                ${extractedMaterials || "The instructor hasn't provided specific slide text for this course yet."}
                """
                `.trim();
            }
        }

        // --- UPGRADE 2: Inject the Bio and Modules into the System Prompt ---
        const userBio = user.bio ? `User Bio: ${user.bio}` : "User Bio: None provided.";
        const enrolledList = user.enrolledCourses?.length > 0 
            ? `Enrolled Courses: ${user.enrolledCourses.map(c => c.title).join(', ')}` 
            : "Enrolled Courses: None yet.";

        const systemPrompt = `
        You are the EduConnect AI Assistant.

        User Context:
        Name: ${user.fullName}
        Role: ${user.role}
        ${userBio}
        ${enrolledList}
        Current page viewing: ${page}

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
        - Question asked should be related to anything that the portal have. If not, let them know that question should be related.
        `.trim();

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", 
            systemInstruction: systemPrompt
        });

        let contents = [];

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

        // --- UPGRADE 3: Gemini Safety Check ---
        // The Gemini API strictly requires that the 'contents' array STARTS with a 'user' message.
        // If our slice caught the AI's greeting first, we must remove it so the API doesn't crash with a 400 error.
        if (contents.length > 0 && contents[0].role === "model") {
            contents.shift(); 
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

// POST /api/courses/:id/generate-ai-quiz
app.post('/api/courses/:id/generate-ai-quiz', protect, async (req, res) => {
    try {
        const { count } = req.body;
        const courseId = req.params.id;

        // 1. Fetch all Subtopics for this course to get the learning materials
        // Adjust this query based on how your Sequelize models are related (Course -> Topic -> Subtopic)
        const subtopics = await Subtopic.findAll({
            include: [{
                model: Topic,
                as: 'topic',
                where: { courseId: courseId }
            }]
        });

        // 2. Combine all the extracted text
        let combinedText = subtopics
            .map(sub => sub.extracted_text)
            .filter(text => text !== null && text.trim() !== '')
            .join('\n\n--- NEXT LESSON ---\n\n');

        if (!combinedText) {
            return res.status(400).json({ message: "No text available in course materials to generate a quiz." });
        }

        // 3. Set up the Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 4. Create the STRICT prompt demanding JSON
        const prompt = `
            You are an expert educator. I will provide you with course material.
            Generate exactly ${count} multiple choice questions based ONLY on this material.
            
            CRITICAL RULES:
            - You MUST output ONLY raw, valid JSON. No markdown formatting, no \`\`\`json wrappers.
            - Follow this EXACT array structure:
            [
              {
                "text": "The question goes here?",
                "type": "MCQ",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "0" 
              }
            ]
            - "correctAnswer" MUST be a string representing the index of the correct option (e.g., "0" for the first option, "1" for the second).
            - Include exactly 4 options per question.

            Here is the course material:
            ${combinedText}
        `;

        // 5. Ask Gemini
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // 6. Clean up the response in case Gemini includes markdown wrappers
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const aiQuestions = JSON.parse(responseText);

        res.json({ aiQuestions });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate questions with AI." });
    }
});