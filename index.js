import express from "express";
import sequelize from "./config/database.js";
import User from "./Models/Users.js";
import Notes from "./Models/Notes.js";

import cors from "cors";
import router from "./routes/user_CRUD.js";
import login_router from "./routes/login.js";
import notes_router from "./routes/notes_CRUD.js";

const app = express();

const PORT = process.env.PORT || 3004;


app.use(cors());
app.use(express.json());
app.use("/usersData", router);
app.use("/", login_router);
app.use("/", notes_router);

// Associations
User.hasMany(Notes, { foreignKey: "userId" });
Notes.belongsTo(User, { foreignKey: "userId" });

sequelize
  .sync() // Use { force: true } to drop and recreate tables, or { alter: true } to update existing tables
  .then(() => {
    console.log("\nDatabase synced");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error syncing database: ", err);
  });
