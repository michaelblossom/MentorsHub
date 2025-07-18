import express from "express";
import authController from "./../controllers/auth.controller";
import Protected from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify", Protected, authController.verifyAccount);
router.post("/resend-otp", Protected, authController.resendOTP);

// router.route("/login").post(authCologin);

export default router;
