"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reviewSchema = new mongoose_1.default.Schema({
    comment: {
        type: String,
        required: [true, "Review can not be empty"],
    },
    projectCharpter: {
        type: String,
        required: [true, "Review must belong to a certain project charpter"],
    },
    //   parent referencing
    project: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Book",
        required: [true, "Review must belong to a projec topic."],
    },
    mentor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Review must come from a mentor."],
    },
}, { timestamps: true });
const Review = mongoose_1.default.model("Review", reviewSchema);
exports.default = Review;
