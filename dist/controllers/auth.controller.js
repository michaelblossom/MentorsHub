"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { promisify } = require("util"); //builtin function for promifying token verification
const helpers_1 = require("./../utils/helpers");
const generateOTP_1 = require("./../utils/generateOTP");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const user_model_1 = __importDefault(require("../models/user.model"));
const JWT = __importStar(require("jsonwebtoken"));
const email_1 = __importDefault(require("../utils/email"));
// function to generate token
const signToken = (id) => {
    return JWT.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: "90d",
    });
};
// function to create and send token to client
const createAndSendToken = (user, statusCode, res, message) => {
    // calling signToken function to generate token
    const token = signToken(user._id);
    const cookieExpiresInDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
    const cookiesOptions = Object.assign({ expiresIn: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 1000), httpOnly: true }, (process.env.NODE_ENV === "production" && { secure: true }));
    res.cookie("jwt", token, cookiesOptions);
    // removing password, passwordComfirm and otp field when a user is signedup
    user.password = undefined;
    user.passwordComfirm = undefined;
    user.otp = undefined;
    res.status(statusCode).json({
        status: "success",
        message,
        token, //sending the token to the user
        data: {
            user: user,
        },
    });
};
// Signup User
const signup = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let email = (0, helpers_1.normalize)(req.body.email);
    const exists = yield user_model_1.default.findOne({ email });
    if (exists === null || exists === void 0 ? void 0 : exists.email) {
        return next(new appError_1.default(`User ${email} already exists`, 400));
    }
    else if (exists === null || exists === void 0 ? void 0 : exists.UserName) {
        return next(new appError_1.default(`User ${req.body.UserName} already exists`, 400));
    }
    const otp = (0, generateOTP_1.generateOTP)();
    const otpExpires = Date.now() + 24 * 60 * 60 * 1000;
    const user = {
        email,
        otp,
        otpExpires,
        password: req.body.password,
        passwordComfirm: req.body.passwordComfirm,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        matricNumber: req.body.matricNumber,
        academicYear: req.body.academicYear,
        role: req.body.role,
    };
    const created = yield user_model_1.default.create(user);
    try {
        yield (0, email_1.default)({
            email: created.email,
            subject: "OTP for Email Verification",
            html: `<h1> Your OTP is: ${otp}<h1>`,
        });
        // calling the createAndSendToken function
        createAndSendToken(created, 201, res, "You have registered successfully");
    }
    catch (error) {
        yield user_model_1.default.findByIdAndDelete(created.id);
        return next(new appError_1.default("There is an error in sending the mail. Try again", 500));
    }
}));
const verifyAccount = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const otp = req.body.otp;
    console.log(` this is the otp${otp}`);
    if (!otp) {
        return next(new appError_1.default("OTP is missing", 400));
    }
    const user = req.user;
    if (user.otp !== otp) {
        return next(new appError_1.default("Invalid OTP", 400));
    }
    // vhecking  if OTP is expired
    if (Date.now() > user.otpExpires) {
        return next(new appError_1.default("OTP has expired. Please request for new OTP", 400));
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    yield user.save({ validateBeforeSave: false });
    createAndSendToken(user, 200, res, "Email has been verified");
}));
const resendOTP = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.user;
    if (!email) {
        return next(new appError_1.default("Email is need in other to send OTP", 400));
    }
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return next(new appError_1.default("User not found", 400));
    }
    if (user.isVerified) {
        return next(new appError_1.default("This account is already verified", 400));
    }
    const newOTP = (0, generateOTP_1.generateOTP)();
    user.otp = newOTP;
    user.otpExpires = Date.now() + 24 * 60 * 60 * 1000;
    yield user.save({ validateBeforeSave: false });
    //send email to the user containing the new OTP
    try {
        yield (0, email_1.default)({
            email: user.email,
            subject: "Resend OTP for Email Verification",
            html: `<h1> Your OTP is: ${newOTP}<h1>`,
        });
        res.status(200).json({
            status: "success",
            message: "A new OTP has been sent to your email",
        });
    }
    catch (error) {
        user.otp = undefined;
        user.otpExpires = undefined;
        yield user.save({ validateBeforeSave: false });
        return next(new appError_1.default("There is an error sending email. please try again", 500));
    }
}));
// loggin a user
const login = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // 1)check if email and password exist
    if (!email || !password) {
        return next(new appError_1.default("please provide email and password", 400));
    }
    //   // 2)check if user exist and password is correct
    const user = yield user_model_1.default.findOne({ email: email }).select("+password");
    if (!user || !(yield user.correctPassword(password, user.password))) {
        return next(new appError_1.default("incorrect email or password", 401));
    }
    //   3)if everything is correct send token
    //calling createAndSendToken function
    createAndSendToken(user, 200, res, "You have successfully loggedin");
}));
const logout = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("token", "loggedout", {
        expires: new Date(Date.now() + 10 + 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }),
        res.status(200).json({
            status: "success",
            message: "Logged out successfully",
        });
}));
const forgotPassword = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        return next(new appError_1.default("No user found", 400));
    }
    //generate password reset otp
    const otp = (0, generateOTP_1.generateOTP)();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = Date.now() + 300000;
    yield user.save({ validateBeforeSave: false });
    //send email to the user containing the password reset OTP
    try {
        yield (0, email_1.default)({
            email: user.email,
            subject: "Your password reset OTP valid for (5 mins)",
            html: `<h1> Your passwort reset OTP is: ${otp}<h1>`,
        });
        res.status(200).json({
            status: "success",
            message: "Your Password reset  OTP has been sent to your email",
        });
    }
    catch (error) {
        user.passwordResetOTP = undefined;
        user.passwordResetOTPExpires = undefined;
        yield user.save({ validateBeforeSave: false });
        return next(new appError_1.default("There is an error sending email. please try again", 500));
    }
}));
//RESET PASSWORD
const resetPassword = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, password, passwordComfirm } = req.body;
    // // 1) get user based on the email, passwordResetOTP,passwordResetOTPExpires
    const user = yield user_model_1.default.findOne({
        email,
        passwordResetOTP: otp,
        passwordResetOTPExpires: { $gt: new Date() },
    });
    // 2) if otp has not expired, and there is user, set the new password
    if (!user) {
        return next(new appError_1.default("No user found as a reuslt of invalid or expired OTP", 400));
    }
    user.password = password;
    user.passwordComfirm = passwordComfirm;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    yield user.save();
    // 3) Log the user in, send JWT
    createAndSendToken(user, 200, res, "Your have successfully reset your password");
}));
// updating password
const updatePassword = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // 1)get the user from the collection
    const user = yield user_model_1.default.findById(req.user.id).select("+password");
    console.log(user);
    // 2)check if the posted pasted password is correct
    // calling correctpassword function from usermodel
    if (!(yield user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new appError_1.default("your current password is wrong", 401));
    }
    // 3)if if the posted password is correct, update the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    yield user.save({ validateBeforeSave: false });
    // 4)Log user in, send jwt
    // calling the createAndSendToken function
    createAndSendToken(user, 200, res, " You have successfully changed your password");
}));
exports.default = {
    signup,
    verifyAccount,
    resendOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updatePassword,
};
