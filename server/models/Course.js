const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define("Course", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  thumbnail: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "courses",
  timestamps: true,
});

module.exports = Course;