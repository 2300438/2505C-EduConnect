const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Question = sequelize.define("Question", {
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('MCQ', 'SHORT', 'LONG'),
    allowNull: false,
    defaultValue: 'MCQ',
  },
  options: {
    type: DataTypes.JSON, // Stores array of options
    allowNull: true,
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},{
  tableName: "questions",
  timestamps: true,
});

module.exports = Question;