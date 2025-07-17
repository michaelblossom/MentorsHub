import { normalize } from "./../utils/helpers";
import { generateOTP } from "./../utils/generateOTP";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { IUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import * as JWT from "jsonwebtoken";

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
      res.status(201).json({
        status: "success",
        data: {
          user: created,
        },
      });
    }
  }
);
export default { signup };
