const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DiscussionBoard = sequelize.define("DiscussionBoard", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Foreign Key linking to the Course
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "discussion_boards",
  timestamps: true,
});

module.exports = DiscussionBoard;