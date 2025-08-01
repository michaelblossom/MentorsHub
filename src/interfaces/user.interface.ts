import { Document } from "mongoose";
export interface IUser extends Document {
  department?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  // passwordChangedAt: any;
  avatar?: string;
  active?: boolean;
  isVerified?: boolean;
  otp: string;
  otpExpires: any;
  passwordResetOTP?: string;
  passwordResetOTPExpires?: Date;
  role?: "mentor" | "mentee(student)" | "admin";
  matricNumber: string;
  academicYear: number;
}
