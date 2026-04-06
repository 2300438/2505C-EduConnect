const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Assuming this is your DB connection path

const Quiz = sequelize.define("Quiz", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requiresPassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},{
  tableName: "quizzes",
  timestamps: true,
});

module.exports = Quiz;