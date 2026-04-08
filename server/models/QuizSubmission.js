const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const QuizSubmission = sequelize.define("QuizSubmission", {
  answers: {
    type: DataTypes.JSON, 
    allowNull: false,
  },
  autoScore: {
    type: DataTypes.INTEGER, 
    defaultValue: 0,
  },
  manualScore: {
    type: DataTypes.INTEGER, 
    defaultValue: 0,
  },
  needsManualGrading: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isGraded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "quiz_submissions",
  timestamps: true,
});

module.exports = QuizSubmission;