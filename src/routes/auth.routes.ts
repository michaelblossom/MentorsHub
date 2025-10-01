import express from "express";
import authController from "./../controllers/auth.controller";
import userController from "./../controllers/user.controller";
import Protected from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.use(Protected);

router.post("/verify-email", authController.verifyAccount);
router.post("/resend-otp", authController.resendOTP);
router.patch("/updateMyPassword", authController.updatePassword);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.get("/get-user-stats", userController.getUserStats);

export default router;
