import express from "express";
import authController from "./../controllers/auth.controller";

const router = express.Router();

router.post("/signup", authController.signup);
// router.route("/login").post(authCologin);

export default router;
