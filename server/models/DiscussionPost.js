const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DiscussionPost = sequelize.define("DiscussionPost", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Foreign Key linking to the Board
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Foreign Key linking to the Student/Instructor who wrote it
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: "discussion_posts",
  timestamps: true,
});

module.exports = DiscussionPost;