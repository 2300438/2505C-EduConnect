const sequelize = require("../config/db");
const User = require("./User");
const Course = require("./Course");
const Enrollment = require("./Enrollment");
const Progress = require("./Progress");
const Topic = require("./Topic");
const Subtopic = require("./Subtopic");

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

User.hasMany(Progress, { foreignKey: "userId" });
Progress.belongsTo(User, { foreignKey: "userId" });

Course.hasMany(Progress, { foreignKey: "courseId" });
Progress.belongsTo(Course, { foreignKey: "courseId" });

Course.hasMany(Topic, { foreignKey: 'courseId', as: 'topics', onDelete: 'CASCADE' });
Topic.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Topic.hasMany(Subtopic, { foreignKey: 'topicId', as: 'subtopics', onDelete: 'CASCADE' });
Subtopic.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

module.exports = {
  sequelize,
  User,
  Course,
  Enrollment,
  Progress,
  Topic,
  Subtopic,
};