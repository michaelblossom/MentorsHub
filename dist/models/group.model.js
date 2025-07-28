"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const groupSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "please provide group name "],
    },
    mentor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Group must have a mentor."],
    },
    maximunGroupSize: {
        type: Number,
        required: [true, "A group must have a group size"],
    },
    users: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
}, { timestamps: true });
// groupSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "mentor",
//     select: "firstName lastName email role",
//   }).populate({
//     path: "users",
//     select: "firstName lastName email role",
//   });
//   next();
// });
const Group = mongoose_1.default.model("Group", groupSchema);
exports.default = Group;
