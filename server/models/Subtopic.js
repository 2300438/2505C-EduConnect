const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subtopic = sequelize.define("Subtopic", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING(1000), // Longer length just in case Vercel URLs get long
    allowNull: true, // Optional, in case an instructor wants a text-only lesson later
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false, // Every subtopic MUST belong to a topic
  },
}, {
  tableName: "subtopics",
  timestamps: true,
});

module.exports = Subtopic;