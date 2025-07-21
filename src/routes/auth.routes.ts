import express from "express";
import authController from "./../controllers/auth.controller";
import Protected from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify-email", Protected, authController.verifyAccount);
router.post("/resend-otp", Protected, authController.resendOTP);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.patch("/updateMyPassword", authController.updatePassword);

export default router;
