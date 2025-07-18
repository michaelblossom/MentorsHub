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
    token, //sending the token to the user
    data: {
      user: user,
    },
  });
};

// Signup User
const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let email = normalize(req.body.email);

    const exists = await User.findOne({ email });

    if (exists?.email) {
      return next(new AppError(`User ${email} already exists`, 400));
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user: Partial<IUser> = {
      email,
      otp,
      otpExpires,
      password: req.body.password,
      passwordComfirm: req.body.passwordComfirm,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      matricNumber: req.body.matricNumber,
      academicYear: req.body.academicYear,
    };

    const created = await User.create(user);
    try {
      await sendEmail({
        email: created.email,
        subject: "OTP for Email Verification",
        html: `<h1> Your OTP is: ${otp}<h1>`,
      });
      // calling the createAndSendToken function
      createAndSendToken(created, 201, res, "You have registered successfully");
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
      return next(new AppError("There is an error sending email", 500));
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }

    createAndSendToken(user, 200, res, "Email has been verified");
  }
);

export default { signup, verifyAccount, resendOTP };
