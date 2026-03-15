const express = require("express");
const yup = require("yup");
const multer = require("multer");
const { put } = require("@vercel/blob");
const upload = multer({ storage: multer.memoryStorage() });
const { Course, User, Topic, Subtopic, Enrollment } = require("../models");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

// --- STRICT YUP VALIDATION SCHEMA ---
const courseSchema = yup.object({
  title: yup.string().trim().min(3).max(150).required("Course title is required"),
  description: yup.string().trim().min(10).required("Course description is required"),
  category: yup.string().trim().max(100).nullable(),
  thumbnail: yup.string().trim().url().nullable(),
  topics: yup.array().of(
    yup.object({
      title: yup.string().trim().required("Topic title is required"),

      subtopics: yup.array().of(
        yup.object({
          title: yup.string().trim().required("Subtopic title is required"),
          videoUrl: yup.string().trim().url("Must be a valid URL").nullable()
        })
      ).nullable()

    })
  ).min(1, "A course must have at least one topic").required()
});

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

// --- GET INSTRUCTOR'S COURSES ---
// IMPORTANT: keep this above "/:id"
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

// --- GET SINGLE COURSE ---
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "instructor",
          attributes: ["id", "fullName", "email"],
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course." });
  }
});

// --- POST: CREATE NEW COURSE ---
router.post("/", validateToken, upload.any(), async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Only instructors can create courses." });
    }

    const { title, description, category, thumbnail, topicsData } = req.body;

    let parsedTopics = [];
    if (topicsData) {
      parsedTopics = JSON.parse(topicsData);
    }

    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      await Promise.all(
        req.files.map(async (file) => {
          const blob = await put(`${Date.now()}-${file.originalname}`, file.buffer, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          uploadedFiles.push({ fieldname: file.fieldname, url: blob.url });
        })
      );
    }

    const mergedTopics = parsedTopics.map((topic, tIndex) => {
      const mergedSubtopics = topic.subtopics.map((sub, sIndex) => {
        const match = uploadedFiles.find(f => f.fieldname === `file_${tIndex}_${sIndex}`);
        return {
          title: sub.title,
          videoUrl: match ? match.url : null
        };
      });

      return {
        title: topic.title,
        subtopics: mergedSubtopics
      };
    });

    const courseDataToValidate = {
      title,
      description,
      category,
      thumbnail,
      topics: mergedTopics
    };

    const validatedData = await courseSchema.validate(courseDataToValidate, { abortEarly: false });

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
        as: "topics",
        include: [{
          model: Subtopic,
          as: "subtopics"
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

// --- PUT: UPDATE COURSE ---
router.put("/:id", validateToken, upload.any(), async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({ message: "Only instructors can edit courses." });
    }

    const course = await Course.findByPk(req.params.id, {
      include: [
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
      ]
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own courses." });
    }

    const { title, description, category, thumbnail, topicsData } = req.body;

    let parsedTopics = [];
    if (topicsData) {
      parsedTopics = JSON.parse(topicsData);
    }

    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      await Promise.all(
        req.files.map(async (file) => {
          const blob = await put(`${Date.now()}-${file.originalname}`, file.buffer, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          uploadedFiles.push({ fieldname: file.fieldname, url: blob.url });
        })
      );
    }

    const mergedTopics = parsedTopics.map((topic, tIndex) => {
      const mergedSubtopics = (topic.subtopics || []).map((sub, sIndex) => {
        const match = uploadedFiles.find(f => f.fieldname === `file_${tIndex}_${sIndex}`);

        return {
          id: sub.id || null,
          title: sub.title,
          videoUrl: match ? match.url : (sub.existingVideoUrl || null),
        };
      });

      return {
        id: topic.id || null,
        title: topic.title,
        subtopics: mergedSubtopics,
      };
    });

    const courseDataToValidate = {
      title,
      description,
      category,
      thumbnail,
      topics: mergedTopics,
    };

    const validatedData = await courseSchema.validate(courseDataToValidate, {
      abortEarly: false,
    });

    // 1. Update main course
    await course.update({
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      thumbnail: validatedData.thumbnail,
    });

    // Existing DB data
    const existingTopics = await Topic.findAll({
      where: { courseId: course.id },
      include: [{ model: Subtopic, as: "subtopics" }],
    });

    const existingTopicMap = new Map(existingTopics.map(topic => [String(topic.id), topic]));
    const incomingTopicIds = new Set(
      validatedData.topics.filter(topic => topic.id).map(topic => String(topic.id))
    );

    // 2. Delete removed topics and their subtopics
    for (const existingTopic of existingTopics) {
      if (!incomingTopicIds.has(String(existingTopic.id))) {
        await Subtopic.destroy({ where: { topicId: existingTopic.id } });
        await Topic.destroy({ where: { id: existingTopic.id } });
      }
    }

    // 3. Update/create topics and subtopics
    for (const topicData of validatedData.topics) {
      let topicRecord;

      if (topicData.id && existingTopicMap.has(String(topicData.id))) {
        topicRecord = existingTopicMap.get(String(topicData.id));
        await topicRecord.update({
          title: topicData.title,
        });
      } else {
        topicRecord = await Topic.create({
          title: topicData.title,
          courseId: course.id,
        });
      }

      const existingSubtopics = await Subtopic.findAll({
        where: { topicId: topicRecord.id },
      });

      const existingSubtopicMap = new Map(
        existingSubtopics.map(sub => [String(sub.id), sub])
      );

      const incomingSubtopicIds = new Set(
        (topicData.subtopics || []).filter(sub => sub.id).map(sub => String(sub.id))
      );

      // Delete removed subtopics
      for (const existingSub of existingSubtopics) {
        if (!incomingSubtopicIds.has(String(existingSub.id))) {
          await Subtopic.destroy({ where: { id: existingSub.id } });
        }
      }

      // Update/create subtopics
      for (const subData of topicData.subtopics || []) {
        if (subData.id && existingSubtopicMap.has(String(subData.id))) {
          const subtopicRecord = existingSubtopicMap.get(String(subData.id));
          await subtopicRecord.update({
            title: subData.title,
            videoUrl: subData.videoUrl,
          });
        } else {
          await Subtopic.create({
            title: subData.title,
            videoUrl: subData.videoUrl,
            topicId: topicRecord.id,
          });
        }
      }
    }

    const updatedCourse = await Course.findByPk(course.id, {
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
      ]
    });

    res.json({
      message: "Course updated successfully.",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Course Update Error:", error);
    const errorMessages = error.inner ? error.inner.map(e => e.message) : [error.message];
    res.status(400).json({
      message: "Course update failed.",
      errors: errorMessages,
    });
  }
});

// --- STUDENT ENROLL IN COURSE ---
router.post("/:courseId/enroll", validateToken, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can enroll in courses." });
    }
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const existingEnrollment = await Enrollment.findOne({
      where: { userId, courseId },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: `You already have an enrollment request with status: ${existingEnrollment.status}`,
      });
    }

    const enrollment = await Enrollment.create({
      userId,
      courseId,
      status: "pending",
    });

    res.status(201).json({
      message: "Enrollment request submitted successfully",
      enrollment,
    });

  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// INSTRUCTOR: GET PENDING ENROLLMENTS
router.get("/:courseId/pending-enrollments", validateToken, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (course.instructorId !== userId) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const enrollments = await Enrollment.findAll({
      where: {
        courseId,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json(enrollments);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// INSTRUCTOR: APPROVE ENROLLMENT
router.put("/enrollments/:id/approve", validateToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [{ model: Course, as: "course" }],
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    if (enrollment.course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized." });
    }

    enrollment.status = "approved";
    await enrollment.save();

    res.json({ message: "Student approved." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// INSTRUCTOR: REJECT ENROLLMENT
router.put("/enrollments/:id/reject", validateToken, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [{ model: Course, as: "course" }],
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    if (enrollment.course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized." });
    }

    enrollment.status = "rejected";
    await enrollment.save();

    res.json({ message: "Student rejected." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// STUDENT/INSTRUCTOR: GET COURSE TOPICS
router.get("/:courseId/topics", validateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const userId = req.user.id;

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const isInstructor = course.instructorId === userId;

    if (!isInstructor) {
      const enrollment = await Enrollment.findOne({
        where: {
          userId,
          courseId,
          status: "approved",
        },
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "Access denied. You are not approved for this course yet.",
        });
      }
    }

    const topics = await Topic.findAll({
      where: { courseId },
      include: [
        {
          model: Subtopic,
          as: "subtopics",
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json(topics);

  } catch (error) {
    console.error("Get course topics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// STUDENT: GET MY ENROLLMENT STATUS FOR A COURSE
router.get("/:courseId/my-enrollment", validateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      where: { userId, courseId },
    });

    if (!enrollment) {
      return res.json({ status: null });
    }

    res.json({
      status: enrollment.status,
      enrollment,
    });
  } catch (error) {
    console.error("Get my enrollment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;