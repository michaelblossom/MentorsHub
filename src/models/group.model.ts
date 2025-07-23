import mongoose from "mongoose";
import { IGroup } from "../interfaces/group.interface";

const groupSchema = new mongoose.Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, "please provide group name "],
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Group must have a mentor."],
    },
    maximunGroupSize: {
      type: Number,
      required: [true, "A group must have a group size"],
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
