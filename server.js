import dotenv, { config } from "dotenv";
import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.js";
import lockRoutes from "./routes/doorLock.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Router
app.use("/api/user", userRoutes);

app.use("/api/lock", lockRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Listening to port ${process.env.PORT}`);
});
