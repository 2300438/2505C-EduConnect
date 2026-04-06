const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const QuizSubmission = sequelize.define("QuizSubmission", {
  answers: {
    type: DataTypes.JSON, // Stores { "question1_id": "answer", "question2_id": "essay text" }
    allowNull: false,
  },
  autoScore: {
    type: DataTypes.INTEGER, // Score from MCQ/Short answers
    defaultValue: 0,
  },
  manualScore: {
    type: DataTypes.INTEGER, // Score awarded by instructor for essays
    defaultValue: 0,
  },
  needsManualGrading: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isGraded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: "quiz_submissions",
  timestamps: true,
});

module.exports = QuizSubmission;