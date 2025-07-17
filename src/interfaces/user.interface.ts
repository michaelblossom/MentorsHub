import { Document } from "mongoose";
export interface IUser extends Document {
  department?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordComfirm: string;
  avatar: string;
  active: boolean;
  isVerified?: boolean;
  otp?: string;
  otpExpires?: Date;
  resetOTPPassword?: string;
  resetOTPPasswordExpires?: Date;
  role: "mentor" | "mentee(student)" | "admin";
  matricNumber: string;
  academicYear: string;
}
