const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Topic = sequelize.define("Topic", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false, // Every topic MUST belong to a course
  },
}, {
  tableName: "topics",
  timestamps: true,
});

module.exports = Topic;