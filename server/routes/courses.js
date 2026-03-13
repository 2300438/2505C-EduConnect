const express = require("express");
const yup = require("yup");
// 1. Ensure Topic and Subtopic are imported here!
const multer = require("multer");
const { put } = require("@vercel/blob");
const upload = multer({ storage: multer.memoryStorage() });
const { Course, User, Topic, Subtopic } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

// --- GET ALL COURSES ---
router.get("/", async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: "instructor",
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses." });
  }
});

// --- GET SINGLE COURSE (Updated to include Topics & Subtopics) ---
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "instructor",
          attributes: ["id", "fullName", "email"],
        },
        {
          model: Topic,
          as: "topics",
          include: [
            {
              model: Subtopic,
              as: "subtopics",
            }
          ]
        }
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course." });
  }
});

// --- GET INSTRUCTOR'S COURSES ---
router.get("/instructor/me", validateToken, async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your courses." });
  }
});

// --- STRICT YUP VALIDATION SCHEMA ---
const courseSchema = yup.object({
  title: yup.string().trim().min(3).max(150).required("Course title is required"),
  description: yup.string().trim().min(10).required("Course description is required"),
  category: yup.string().trim().max(100).nullable(),
  thumbnail: yup.string().trim().url().nullable(),

  // Validate the nested Topics array
  topics: yup.array().of(
    yup.object({
      title: yup.string().trim().required("Topic title is required"),

      // Validate the nested Subtopics array inside each Topic
      subtopics: yup.array().of(
        yup.object({
          title: yup.string().trim().required("Subtopic title is required"),
          videoUrl: yup.string().trim().url("Must be a valid URL").nullable()
        })
      ).min(1, "Each topic must have at least one subtopic").required()

    })
  ).min(1, "A course must have at least one topic").required()
});

// --- POST: CREATE NEW COURSE ---
// --- POST: CREATE NEW COURSE ---
router.post("/", validateToken, upload.any(), async (req, res) => {
  try {
    // 1. Role Check
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Only instructors can create courses." });
    }

    // 2. Parse the incoming text data from FormData
    const { title, description, category, thumbnail, topicsData } = req.body;

    let parsedTopics = [];
    if (topicsData) {
      parsedTopics = JSON.parse(topicsData);
    }

    // 3. Securely upload all received files to Vercel Blob
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      await Promise.all(
        req.files.map(async (file) => {
          const blob = await put(`${Date.now()}-${file.originalname}`, file.buffer, {
            access: 'private',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          uploadedFiles.push({ fieldname: file.fieldname, url: blob.url });
        })
      );
    }

    // 4. Map the new Vercel URLs to their corresponding subtopics
    const mergedTopics = parsedTopics.map((topic, tIndex) => {
      const mergedSubtopics = topic.subtopics.map((sub, sIndex) => {
        // Find the matching file uploaded for this specific subtopic slot
        const match = uploadedFiles.find(f => f.fieldname === `file_${tIndex}_${sIndex}`);
        return {
          title: sub.title,
          videoUrl: match ? match.url : null
        };
      });
      return { title: topic.title, subtopics: mergedSubtopics };
    });

    // 5. Build the final object and pass it to your Yup Schema
    const courseDataToValidate = {
      title,
      description,
      category,
      thumbnail,
      topics: mergedTopics
    };

    const validatedData = await courseSchema.validate(courseDataToValidate, { abortEarly: false });

    // 6. Database Insertion (Course + Topics + Subtopics)
    const course = await Course.create({
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      thumbnail: validatedData.thumbnail,
      instructorId: req.user.id,
      topics: validatedData.topics
    }, {
      include: [{
        model: Topic,
        as: 'topics',
        include: [{
          model: Subtopic,
          as: 'subtopics'
        }]
      }]
    });

    res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    console.error("Course Creation Error:", error);
    const errorMessages = error.inner ? error.inner.map(e => e.message) : [error.message];
    res.status(400).json({
      message: "Course creation failed.",
      errors: errorMessages,
    });
  }
});

module.exports = router;