"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// import { promisify } from "util";
const { promisify } = require("util"); //builtin function for promifying token verification
const JWT = __importStar(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
// PROTECT MIDDLEWARE
const Protected = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // 1)Getting token and check if it exist
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    else if (req.cookies.JWT) {
        token = req.cookie.JWT;
    }
    if (!token) {
        // console.log(token);
        return next(new appError_1.default("you are not loggedin, please login to get access", 401));
    }
    // 2)verify the token
    // the decoded variable will return the payload({id, time token created , time token expires})
    const decoded = yield promisify(JWT.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);
    // 3)check if the user accessing the route still exist
    const currentUser = yield user_model_1.default.findById(decoded.id); //we are using findById because we use our id as our payload in generating the token that is stored in our decoded
    if (!currentUser) {
        return next(new appError_1.default("The User belonging to this token does not exist anylonger", 401));
    }
    // //   // 4)check if user change password after token was issued
    // //   // calling passwordchangedAfter function from userModel
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(
    //     new AppError("User recently changed password please login again", 401)
    //   );
    // }
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
}));
exports.default = Protected;
