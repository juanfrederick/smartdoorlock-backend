import express from "express";
import requireAuth from "../middleware/auth.js";

import {
  userLogin,
  userSignup,
  userGetDetails,
  userUpdateDetails,
  userLogout,
  userTest,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/login", userLogin);

router.post("/signup", userSignup);

router.get("/test/firebase", userTest);

router.use(requireAuth);

router.post("/logout", userLogout);

router.patch("/lock/details", userUpdateDetails);

router.get("/lock/details", userGetDetails);

export default router;
