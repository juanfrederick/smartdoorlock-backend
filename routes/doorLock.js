import express from "express";
import {
  createNewDoor,
  getLockHistory,
  getLockStatus,
  lockDoor,
  unlockDoor,
} from "../controllers/doorLockController.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.post("/create", createNewDoor);

router.use(requireAuth);

router.get("/data", getLockStatus);

router.patch("/off", lockDoor);

router.patch("/on", unlockDoor);

router.get("/history", getLockHistory);

export default router;
