const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SupportTicket = sequelize.define("SupportTicket", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // guest can submit without login
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("open", "in-progress", "resolved"),
    defaultValue: "open",
  },
}, {
  tableName: "support_tickets",
  timestamps: true,
});

module.exports = SupportTicket;