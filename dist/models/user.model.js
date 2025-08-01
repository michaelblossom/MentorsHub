"use strict";
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
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
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
        validate: [validator_1.default.isEmail, "please provide a valid email"],
    },
    password: {
        type: String,
        required: [true, "please provide your password "],
        minlenght: 5,
        select: false,
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
}, { timestamps: true });
// hashing password
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next(); // this line of code simply means that the password can only be encripted only when(created or updated))
        this.password = yield bcryptjs_1.default.hash(this.password, 12); //encrypting or hashing the password
        this.passwordComfirm = undefined; //this will delete password confirm field so that it will not be stored in the database
        next();
    });
});
// // update changedPasswordAt field for the user(for resetting password)
// userSchema.pre("save", function (next) {
//   if (!this.isModified("password") || this.isNew) return next();
//   (this as any).passwordChangedAt = Date.now() - 1000; // this line of code will set the passwordChangedAt value to the current date after (created or updated)
//   next();
// });
userSchema.methods.correctPassword = function (candidatePassword, userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(candidatePassword, userPassword);
    });
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
