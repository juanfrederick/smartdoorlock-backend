import express from "express";
import {
  createNewDoor,
  getDetectHistory,
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

router.post("/off", lockDoor);

router.post("/on", unlockDoor);

router.get("/history", getLockHistory);

router.get("/detect", getDetectHistory);

export default router;
