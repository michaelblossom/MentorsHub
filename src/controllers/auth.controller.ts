const { promisify } = require("util"); //builtin function for promifying token verification
import { normalize } from "./../utils/helpers";
import { generateOTP } from "./../utils/generateOTP";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { IUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import * as JWT from "jsonwebtoken";

// function to generate token
const signToken = (id: any) => {
  return JWT.sign({ id: id }, process.env.JWT_SECRET!, {
    expiresIn: "90d",
  });
};

// function to create and send token to client
const createAndSendToken = (user: any, statusCode: any, res: Response) => {
  // calling signToken function to generate token
  const token = signToken(user._id);
  const cookieExpiresInDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
  const cookiesOptions = {
    expiresIn: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 1000),
    httpOnly: true,
    ...(process.env.NODE_ENV === "production" && { secure: true }),
  };

  res.cookie("jwt", token, cookiesOptions);

  // removing password field when a user is signedup
  user.password = undefined;
  user.passwordComfirm = undefined;

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

    if (!created) {
      return next(new AppError(`Error creating user! Please try again`, 400));
    } else {
      // calling the createAndSendToken function
      createAndSendToken(created, 201, res);
    }
  }
);
export default { signup };
