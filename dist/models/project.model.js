"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const projectSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "please provide project name "],
    },
    topic: {
        type: String,
        required: [true, "please provide project name "],
    },
    status: {
        type: String,
        enum: ["Approved", "Rejected", "Submitted"],
        default: "Submitted",
    },
    stage: {
        type: String,
        enum: ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"],
        default: "Chapter 1",
    },
    file: {
        type: String,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Project must belong to a user."],
    },
    groupId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Group",
        required: [true, "Project must belong to a Group."],
    },
}, { timestamps: true });
const Project = mongoose_1.default.model("Project", projectSchema);
exports.default = Project;
