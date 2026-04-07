const express = require("express");
const yup = require("yup");
const multer = require("multer");
const { put } = require("@vercel/blob");
const upload = multer({ storage: multer.memoryStorage() });
const { Course, User, Topic, Subtopic, Enrollment, Progress, Quiz, Question, DiscussionBoard } = require("../models");
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
          fileUrl: yup.string().trim().url("Must be a valid URL").nullable()
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
        },
        {
          model: Topic,
          as: "topics",
          include: [{ model: Subtopic, as: "subtopics" }]
        },
        // NEW: Include Quizzes and their Questions
        {
          model: Quiz,
          as: "quizzes",
          include: [{ model: Question, as: "questions" }]
        },
        // NEW: Include Discussions
        {
          model: DiscussionBoard,
          as: "discussions"
        }
      ],
      order: [
        [{ model: Topic, as: 'topics' }, 'createdAt', 'ASC'],
        [{ model: Quiz, as: 'quizzes' }, 'createdAt', 'ASC']
      ]
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json(course);
  } catch (error) {
    console.error("Fetch single course error:", error);
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
          fileUrl: match ? match.url : null
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

    // Notice discussionsData is added here!
    const { title, description, category, thumbnail, topicsData, discussionsData } = req.body;

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
          fileUrl: match ? match.url : (sub.existingfileUrl || null),
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

    // Existing DB data for topics
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
            fileUrl: subData.fileUrl,
          });
        } else {
          await Subtopic.create({
            title: subData.title,
            fileUrl: subData.fileUrl,
            topicId: topicRecord.id,
          });
        }
      }
    }

    // --- 4. Update/create discussion boards ---
    if (discussionsData) {
      const parsedDiscussions = JSON.parse(discussionsData);
      
      const existingBoards = await DiscussionBoard.findAll({
        where: { courseId: course.id }
      });
      
      const existingBoardMap = new Map(existingBoards.map(b => [String(b.id), b]));
      const incomingBoardIds = new Set(
        parsedDiscussions.filter(b => b.id).map(b => String(b.id))
      );

      // Delete removed boards
      for (const board of existingBoards) {
        if (!incomingBoardIds.has(String(board.id))) {
          await DiscussionBoard.destroy({ where: { id: board.id } });
        }
      }

      // Update or Create boards
      for (const discData of parsedDiscussions) {
        if (discData.id && existingBoardMap.has(String(discData.id))) {
          const boardRecord = existingBoardMap.get(String(discData.id));
          await boardRecord.update({
            title: discData.title,
            prompt: discData.prompt,
          });
        } else {
          await DiscussionBoard.create({
            title: discData.title,
            prompt: discData.prompt,
            courseId: course.id,
          });
        }
      }
    }

    // --- 5. Fetch the fully updated course to send back to the frontend ---
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
        },
        {
          model: DiscussionBoard,
          as: "discussions"
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
          attributes: ["id", "fullName", "email"],
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

    // Update status to approved
    enrollment.status = "approved";
    await enrollment.save();

    // Create or find progress record
    await Progress.findOrCreate({
      where: { userId: enrollment.userId, courseId: enrollment.courseId },
      defaults: {
        progressPercent: 0,
        lastAccessedAt: new Date(),
      }
    });

    // Return a clean 200 status with a JSON object
    return res.status(200).json({ success: true, message: "Student approved." });
  } catch (error) {
    console.error("Approval error:", error);
    return res.status(500).json({ success: false, message: "Server error during approval." });
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

    return res.status(200).json({ success: true, message: "Student rejected." });
  } catch (error) {
    console.error("Rejection error:", error);
    return res.status(500).json({ success: false, message: "Server error during rejection." });
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

// STUDENT/INSTRUCTOR: GET SINGLE SUBTOPIC
router.get("/:courseId/subtopics/:subtopicId", validateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const subtopicId = parseInt(req.params.subtopicId, 10);
    const userId = req.user.id;

    // 1. Find the course to check permissions
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // 2. Check if user is instructor or an approved student
    const isInstructor = course.instructorId === userId;

    if (!isInstructor) {
      const enrollment = await Enrollment.findOne({
        where: { userId, courseId, status: "approved" },
      });

      if (!enrollment) {
        return res.status(403).json({ message: "Access denied. You are not approved for this course." });
      }
    }

    // 3. Fetch the specific subtopic
    const subtopic = await Subtopic.findByPk(subtopicId);

    if (!subtopic) {
      return res.status(404).json({ message: "Subtopic not found." });
    }

    // 4. Send the data (which includes the fileUrl) back to the frontend
    res.json(subtopic);

  } catch (error) {
    console.error("Get single subtopic error:", error);
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

// --- POST: CREATE QUIZ WITH QUESTIONS ---
router.post("/:courseId/quizzes", validateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, category, thumbnail, topicsData, discussionsData } = req.body;

    // 1. Verify Course & Ownership
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });
    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to add quizzes to this course." });
    }

    // 2. Create the Quiz
    const quiz = await Quiz.create({
      title,
      description,
      requiresPassword,
      password: requiresPassword ? password : null,
      courseId
    });

    // 3. Create the Questions (if any were provided)
    if (questions && questions.length > 0) {
      const questionsData = questions.map(q => ({
        text: q.text,
        type: q.type,
        options: q.type === 'MCQ' ? q.options : null,
        correctAnswer: q.correctAnswer,
        quizId: quiz.id
      }));

      await Question.bulkCreate(questionsData);
    }

    res.status(201).json({ message: "Quiz created successfully!", quiz });
  } catch (error) {
    console.error("Quiz Creation Error:", error);
    res.status(500).json({ message: "Failed to create quiz." });
  }
});
// 1. STUDENT GET QUIZ (Hides answers and password)
router.get("/:courseId/quizzes/:quizId", validateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: { id: req.params.quizId, courseId: req.params.courseId },
      include: [{
        model: Question,
        as: "questions",
        // CRITICAL: We DO NOT send the correct answer to the frontend!
        attributes: ['id', 'text', 'type', 'options']
      }]
    });

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Send the quiz data, but strip the actual password string for security
    res.json({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      requiresPassword: quiz.requiresPassword,
      questions: quiz.questions
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quiz." });
  }
});

// 2. VERIFY PASSWORD
router.post("/:courseId/quizzes/:quizId/verify-password", validateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const quiz = await Quiz.findByPk(req.params.quizId);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (!quiz.requiresPassword) return res.status(200).json({ success: true });

    // In a real app, you'd use bcrypt here. For now, strict equality based on your DB.
    if (quiz.password === password) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Verification failed." });
  }
});

// 3. GRADE SUBMISSION
router.post("/:courseId/quizzes/:quizId/submit", validateToken, async (req, res) => {
  try {
    const { answers } = req.body; // Looks like { "questionId_1": "0", "questionId_2": "apple" }

    // Fetch questions WITH the correct answers so we can grade them
    const questions = await Question.findAll({ where: { quizId: req.params.quizId } });

    let score = 0;
    let autoGradableCount = 0;
    let pendingManualGrade = false;

    questions.forEach((q) => {
      const studentAnswer = answers[q.id];

      if (q.type === 'MCQ') {
        autoGradableCount++;
        if (studentAnswer === q.correctAnswer) score++;
      }
      else if (q.type === 'SHORT') {
        autoGradableCount++;
        // Case insensitive grading, trimmed whitespace
        if (studentAnswer?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) {
          score++;
        }
      }
      else if (q.type === 'LONG') {
        pendingManualGrade = true; // Cannot auto-grade essays
      }
    });

    // NOTE: In a full production app, you would save this score to a 'QuizSubmissions' table here!

    res.json({
      score,
      total: autoGradableCount,
      message: pendingManualGrade ? "Your short/multiple choice answers have been graded. Essays are pending review by your instructor." : "Quiz graded successfully!"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to grade submission." });
  }
});

// 1. INSTRUCTOR: GET SUBMISSIONS NEEDING GRADING
router.get("/instructor/pending-grading", validateToken, async (req, res) => {
  try {
    const submissions = await QuizSubmission.findAll({
      where: {
        needsManualGrading: true,
        isGraded: false
      },
      include: [
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
        {
          model: Quiz,
          as: "quiz",
          // Verify this instructor owns the course the quiz belongs to
          include: [{ model: Course, as: "course", where: { instructorId: req.user.id } }, { model: Question, as: "questions" }]
        }
      ],
      order: [["createdAt", "ASC"]]
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending grades." });
  }
});

// 2. INSTRUCTOR: SUBMIT FINAL GRADE
router.put("/instructor/grade-submission/:id", validateToken, async (req, res) => {
  try {
    const { manualScore } = req.body;
    const submission = await QuizSubmission.findByPk(req.params.id);

    if (!submission) return res.status(404).json({ message: "Submission not found." });

    // Update the submission
    submission.manualScore = manualScore;
    submission.isGraded = true;
    submission.needsManualGrading = false;
    await submission.save();

    res.json({ message: "Grade saved successfully!", submission });
  } catch (error) {
    res.status(500).json({ message: "Failed to save grade." });
  }
});

// GET a specific quiz for editing
router.get('/:courseId/quizzes/:quizId', async (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        
        const quiz = await Quiz.findOne({
            where: { id: quizId, courseId: courseId }
        });

        if (!quiz) return res.status(404).json({ message: "Quiz not found." });
        
        res.json(quiz);
    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({ message: "Internal server error while fetching quiz." });
    }
});

// PUT (Update) a specific quiz
router.put('/:courseId/quizzes/:quizId', async (req, res) => {
    try {
        const { courseId, quizId } = req.params;
        const { title, description, requiresPassword, password, questions } = req.body;

        const quiz = await Quiz.findOne({
            where: { id: quizId, courseId: courseId }
        });

        if (!quiz) return res.status(404).json({ message: "Quiz not found." });

        // Update the quiz fields
        quiz.title = title;
        quiz.description = description;
        quiz.requiresPassword = requiresPassword;
        quiz.password = requiresPassword ? password : null; 
        quiz.questions = questions;

        await quiz.save();

        res.json({ message: "Quiz updated successfully!", quiz });
    } catch (error) {
        console.error("Error updating quiz:", error);
        res.status(500).json({ message: "Internal server error while updating quiz." });
    }
});

module.exports = router;