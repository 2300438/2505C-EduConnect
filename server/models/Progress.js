const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Progress = sequelize.define("Progress", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  progressPercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "progress",
  timestamps: true,
});

module.exports = Progress;