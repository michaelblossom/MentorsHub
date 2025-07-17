import mongoose from "mongoose";
import { IUser } from "../interfaces/user.interface";
// import validator from "validator";

// TODO:
const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "please provide your first name"],
      trim: true,
      minlenght: 3,
      maxlenght: 20,
    },
    lastName: {
      type: String,
      required: [true, "please provide your last name"],
      trim: true,
      minlenght: 3,
      maxlenght: 20,
    },
    email: {
      type: String,
      required: [true, "please provide your email "],
      unique: true,
      lowercase: true,
      //   validate: [validator.isEmail, "please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "please provide your password "],
      minlenght: 5,
      select: false,
    },
    // passwordConfirm: {
    //   type: String,
    //   required: [true, "please confirm your password"],
    //   validate: {
    //     validator: function (el: any): any {
    //       return el === (this as any).password;
    //     },
    //     message: "passwords are not the same",
    //   },
    // },
    department: {
      type: String,
      default: "Computer Science",
    },
    matricNumber: {
      type: String,
      required: [true, "please provide your matric number "],
    },
    academicYear: {
      type: Number,
      required: [true, "please provide your matric number "],
    },
    avatar: { type: String },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    resetOTPPassword: {
      type: String,
      default: null,
    },
    resetOTPPasswordExpires: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["mentor", "mentee(student)", "admin"],
      default: "mentee(student)",
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
