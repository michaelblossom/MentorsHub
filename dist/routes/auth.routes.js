"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importDefault(require("./../controllers/auth.controller"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const router = express_1.default.Router();
router.post("/signup", auth_controller_1.default.signup);
router.post("/login", auth_controller_1.default.login);
router.post("/verify-email", auth_middleware_1.default, auth_controller_1.default.verifyAccount);
router.post("/resend-otp", auth_middleware_1.default, auth_controller_1.default.resendOTP);
router.post("/login", auth_controller_1.default.login);
router.post("/logout", auth_controller_1.default.logout);
router.post("/forgot-password", auth_controller_1.default.forgotPassword);
router.post("/reset-password", auth_controller_1.default.resetPassword);
router.patch("/updateMyPassword", auth_controller_1.default.updatePassword);
exports.default = router;
