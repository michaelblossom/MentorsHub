const { promisify } = require("util"); //builtin function for promifying token verification
import { normalize } from "./../utils/helpers";
import { generateOTP } from "./../utils/generateOTP";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { IUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import * as JWT from "jsonwebtoken";
import sendEmail from "../utils/email";
import app from "../app";
// function to generate token
const signToken = (id: any) => {
  return JWT.sign({ id: id }, process.env.JWT_SECRET!, {
    expiresIn: "90d",
  });
};

// function to create and send token to client
const createAndSendToken = (
  user: any,
  statusCode: any,
  res: Response,
  message: string
) => {
  // calling signToken function to generate token
  const token = signToken(user._id);
  const cookieExpiresInDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
  const cookiesOptions = {
    expiresIn: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 1000),
    httpOnly: true,
    ...(process.env.NODE_ENV === "production" && { secure: true }),
  };

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
const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let _email = normalize(req.body.email);

    const exists = await User.findOne({ _email });

    if (exists?.email) {
      return next(new AppError(`User ${_email} already exists`, 400));
    } else if (exists?.UserName) {
      return next(
        new AppError(`User ${req.body.UserName} already exists`, 400)
      );
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user: Partial<IUser> = {
      email: _email,
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

    const created = await User.create(user);
    const {
      department,
      isVerified,
      role,
      email,
      firstName,
      lastName,
      matricNumber,
      academicYear,
    } = created;
    try {
      await sendEmail({
        email: created.email,
        subject: "OTP for Email Verification",
        html: `<h1> Your OTP is: ${otp}<h1>`,
      });
      // calling the createAndSendToken function
      createAndSendToken(
        {
          department,
          isVerified,
          role,
          email,
          firstName,
          lastName,
          matricNumber,
          academicYear,
        },
        201,
        res,
        "You have registered successfully"
      );
    } catch (error) {
      await User.findByIdAndDelete(created.id);
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }
  }
);

const verifyAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const otp = req.body.otp;
    console.log(` this is the otp${otp}`);
    if (!otp) {
      return next(new AppError("OTP is missing", 400));
    }
    const user = (req as any).user;
    if (user.otp !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }
    // vhecking  if OTP is expired
    if (Date.now() > user.otpExpires) {
      return next(
        new AppError("OTP has expired. Please request for new OTP", 400)
      );
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    createAndSendToken(user, 200, res, "Email has been verified");
  }
);
const resendOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = (req as any).user;
    if (!email) {
      return next(new AppError("Email is need in other to send OTP", 400));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 400));
    }
    if (user.isVerified) {
      return next(new AppError("This account is already verified", 400));
    }
    const newOTP = generateOTP();
    user.otp = newOTP;
    user.otpExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    //send email to the user containing the new OTP
    try {
      await sendEmail({
        email: user.email,
        subject: "Resend OTP for Email Verification",
        html: `<h1> Your OTP is: ${newOTP}<h1>`,
      });
      res.status(200).json({
        status: "success",
        message: "A new OTP has been sent to your email",
      });
    } catch (error) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError("There is an error sending email. please try again", 500)
      );
    }
  }
);
// loggin a user
const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    // 1)check if email and password exist
    if (!email || !password) {
      return next(new AppError("please provide email and password", 400));
    }

    //   // 2)check if user exist and password is correct
    const user = await User.findOne({ email: email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("incorrect email or password", 401));
    }
    //   3)if everything is correct send token
    //calling createAndSendToken function
    createAndSendToken(user, 200, res, "You have successfully loggedin");
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("token", "loggedout", {
      expires: new Date(Date.now() + 10 + 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }),
      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
  }
);
const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("No user found", 400));
    }
    //generate password reset otp

    const otp = generateOTP();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = Date.now() + 300000;
    await user.save({ validateBeforeSave: false });

    //send email to the user containing the password reset OTP
    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset OTP valid for (5 mins)",
        html: `<h1> Your passwort reset OTP is: ${otp}<h1>`,
      });
      res.status(200).json({
        status: "success",
        message: "Your Password reset  OTP has been sent to your email",
      });
    } catch (error) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError("There is an error sending email. please try again", 500)
      );
    }
  }
);

//RESET PASSWORD
const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, password, passwordComfirm } = req.body;
    // // 1) get user based on the email, passwordResetOTP,passwordResetOTPExpires

    const user = await User.findOne({
      email,
      passwordResetOTP: otp,
      passwordResetOTPExpires: { $gt: new Date() },
    });

    // 2) if otp has not expired, and there is user, set the new password
    if (!user) {
      return next(
        new AppError("No user found as a reuslt of invalid or expired OTP", 400)
      );
    }

    user.password = password;
    user.passwordComfirm = passwordComfirm;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save();
    // 3) Log the user in, send JWT
    createAndSendToken(
      user,
      200,
      res,
      "Your have successfully reset your password"
    );
  }
);

// updating password
const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1)get the user from the collection
    const user = await User.findById((req as any).user.id).select("+password");
    console.log(user);
    // 2)check if the posted pasted password is correct
    // calling correctpassword function from usermodel
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("your current password is wrong", 401));
    }
    // 3)if if the posted password is correct, update the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save({ validateBeforeSave: false });
    // 4)Log user in, send jwt
    // calling the createAndSendToken function
    createAndSendToken(
      user,
      200,
      res,
      " You have successfully changed your password"
    );
  }
);
export default {
  signup,
  verifyAccount,
  resendOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
};
