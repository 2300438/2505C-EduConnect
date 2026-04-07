const sequelize = require("../config/db");
const User = require("./User");
const Course = require("./Course");
const Enrollment = require("./Enrollment");
const Progress = require("./Progress");
const Topic = require("./Topic");
const Subtopic = require("./Subtopic");
const Quiz = require("./Quiz");
const Question = require("./Question");
const QuizSubmission = require("./QuizSubmission");
const DiscussionBoard = require("./DiscussionBoard");
const DiscussionPost = require("./DiscussionPost");
const SupportTicket = require("./SupportTicket"); // ADD THIS

// --- COURSE & USER ASSOCIATIONS (Enrollment) ---
User.hasMany(Course, { foreignKey: "instructorId", as: "coursesTaught" });
Course.belongsTo(User, { foreignKey: "instructorId", as: "instructor" });

User.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: "userId",
  otherKey: "courseId",
  as: "enrolledCourses",
});

Course.belongsToMany(User, {
  through: Enrollment,
  foreignKey: "courseId",
  otherKey: "userId",
  as: "students",
});

User.hasMany(Enrollment, { foreignKey: "userId" });
Enrollment.belongsTo(User, { foreignKey: "userId", as: "user" });

Course.hasMany(Enrollment, { foreignKey: "courseId" });
Enrollment.belongsTo(Course, { foreignKey: "courseId", as: "course" });

// --- PROGRESS ASSOCIATIONS ---
User.hasMany(Progress, { foreignKey: "userId" });
Progress.belongsTo(User, { foreignKey: "userId" });

Course.hasMany(Progress, { foreignKey: "courseId" });
Progress.belongsTo(Course, { foreignKey: "courseId" });

// --- CONTENT ASSOCIATIONS ---
Course.hasMany(Topic, { foreignKey: "courseId", as: "topics", onDelete: "CASCADE" });
Topic.belongsTo(Course, { foreignKey: "courseId", as: "course" });

Topic.hasMany(Subtopic, { foreignKey: "topicId", as: "subtopics", onDelete: "CASCADE" });
Subtopic.belongsTo(Topic, { foreignKey: "topicId", as: "topic" });

// --- QUIZ ASSOCIATIONS ---
Course.hasMany(Quiz, { as: "quizzes", foreignKey: "courseId", onDelete: "CASCADE" });
Quiz.belongsTo(Course, { as: "course", foreignKey: "courseId" });

Quiz.hasMany(Question, { as: "questions", foreignKey: "quizId", onDelete: "CASCADE" });
Question.belongsTo(Quiz, { as: "quiz", foreignKey: "quizId" });

Quiz.hasMany(QuizSubmission, { foreignKey: "quizId", onDelete: "CASCADE" });
QuizSubmission.belongsTo(Quiz, { foreignKey: "quizId", as: "quiz" });

User.hasMany(QuizSubmission, { foreignKey: "userId", onDelete: "CASCADE" });
QuizSubmission.belongsTo(User, { foreignKey: "userId", as: "student" });

// --- DISCUSSION ASSOCIATIONS ---
Course.hasMany(DiscussionBoard, { as: "discussions", foreignKey: "courseId", onDelete: "CASCADE" });
DiscussionBoard.belongsTo(Course, { as: "course", foreignKey: "courseId" });

DiscussionBoard.hasMany(DiscussionPost, { as: "posts", foreignKey: "boardId", onDelete: "CASCADE" });
DiscussionPost.belongsTo(DiscussionBoard, { as: "board", foreignKey: "boardId" });

User.hasMany(DiscussionPost, { as: "posts", foreignKey: "userId", onDelete: "CASCADE" });
DiscussionPost.belongsTo(User, { as: "author", foreignKey: "userId" });

// --- SUPPORT TICKET ASSOCIATIONS ---
User.hasMany(SupportTicket, { foreignKey: "userId", as: "supportTickets" });
SupportTicket.belongsTo(User, { foreignKey: "userId", as: "user" });

// --- EXPORTS ---
module.exports = {
  sequelize,
  User,
  Course,
  Enrollment,
  Progress,
  Topic,
  Subtopic,
  Quiz,
  Question,
  QuizSubmission,
  DiscussionBoard,
  DiscussionPost,
  SupportTicket, // ADD THIS
};