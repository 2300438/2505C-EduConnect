const sequelize = require("../config/db");
const User = require("./User");
const Course = require("./Course");
const Enrollment = require("./Enrollment");
const Progress = require("./Progress");

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
Enrollment.belongsTo(User, { foreignKey: "userId" });

Course.hasMany(Enrollment, { foreignKey: "courseId" });
Enrollment.belongsTo(Course, { foreignKey: "courseId" });

User.hasMany(Progress, { foreignKey: "userId" });
Progress.belongsTo(User, { foreignKey: "userId" });

Course.hasMany(Progress, { foreignKey: "courseId" });
Progress.belongsTo(Course, { foreignKey: "courseId" });

module.exports = {
  sequelize,
  User,
  Course,
  Enrollment,
  Progress,
};