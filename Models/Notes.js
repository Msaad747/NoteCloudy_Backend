import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Notes = sequelize.define("Notes", {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: "Users",
      key: "id",
    },
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 20],
    },
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [10, 255],
    },
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "general",
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Notes;
