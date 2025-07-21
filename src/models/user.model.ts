import mongoose from "mongoose";
import { IUser } from "../interfaces/user.interface";
import validator from "validator";
import bcrypt from "bcryptjs";

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
      validate: [validator.isEmail, "please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "please provide your password "],
      minlenght: 5,
      select: false,
    },
    passwordComfirm: {
      type: String,
      required: [true, "passwordComfim does not match with the password"],
      validate: {
        validator: function (el: string): any {
          return el === (this as any).password;
        },
        message: "passwords are not the same",
      },
    },

    department: {
      type: String,
      default: "Computer Science",
    },
    phoneNumber: {
      type: String,
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
    passwordResetOTP: {
      type: String,
      default: null,
    },
    passwordResetOTPExpires: {
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
    // passwordChangedAt: Date,
  },
  { timestamps: true }
);

// hashing password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // this line of code simply means that the password can only be encripted only when(created or updated))
  this.password = await bcrypt.hash(this.password, 12); //encrypting or hashing the password
  (this as any).passwordComfirm = undefined; //this will delete password confirm field so that it will not be stored in the database
  next();
});

// // update changedPasswordAt field for the user(for resetting password)
// userSchema.pre("save", function (next) {
//   if (!this.isModified("password") || this.isNew) return next();
//   (this as any).passwordChangedAt = Date.now() - 1000; // this line of code will set the passwordChangedAt value to the current date after (created or updated)
//   next();
// });

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

export default User;
