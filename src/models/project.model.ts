import { IProject } from "../interfaces/project.interface";
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema<IProject>(
  {
    topic: {
      type: String,
      required: [true, "please provide project topic "],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "please provide project description "],
      unique: true,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project must belong to a user."],
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Project must belong to a Group."],
    },
  },

  { timestamps: true }
);
projectSchema.index({ status: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
