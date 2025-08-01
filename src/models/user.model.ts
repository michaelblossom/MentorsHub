import mongoose from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'please provide your first name'],
      trim: true,
      minlenght: 3,
      maxlenght: 20,
    },
    lastName: {
      type: String,
      required: [true, 'please provide your last name'],
      trim: true,
      minlenght: 3,
      maxlenght: 20,
    },
    email: {
      type: String,
      required: [true, 'please provide your email '],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'please provide your password '],
      minlenght: 5,
      select: false,
    },

    department: {
      type: String,
      default: 'Computer Science',
    },
    phoneNumber: {
      type: String,
    },
    matricNumber: {
      type: String,
      validate: {
        validator: function (this: mongoose.Document & IUser, value: string) {
          if (this.role === 'student') {
            return !!value && value.trim().length > 0;
          }
          return true;
        },
        message: 'Matric number is required for students',
      },
    },

    academicYear: {
      type: Number,
      validate: {
        validator: function (this: mongoose.Document & IUser, value: number) {
          if (this.role === 'student') {
            return value !== null && value !== undefined;
          }
          return true;
        },
        message: 'Academic year is required for students',
      },
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
      enum: ['supervisor', 'student', 'admin'],
      default: 'student',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true }
);

// hashing password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // this line of code simply means that the password can only be encripted only when(created or updated))
  this.password = await bcrypt.hash(this.password, 12); //encrypting or hashing the password
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

const User = mongoose.model('User', userSchema);

export default User;
