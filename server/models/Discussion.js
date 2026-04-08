const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Discussion = sequelize.define("Discussion", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
},{
  tableName: "discussions",
  timestamps: true,
});

module.exports = Discussion;