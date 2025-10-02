import { IGroup } from "../interfaces/group.interface";
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, "please provide group name "],
      unique: true,
    },
    // TODO: Check if the user being added is a supervisor before adding the user to group
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    maximumGroupSize: {
      type: Number,
      required: [true, "A group must have a maximum group size"],
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    archive: {
      type: Boolean,
      default: false,
      select: false,
    },
  },

  { timestamps: true }
);

// this query will help us to only get the user that are not deleted(active:true)
groupSchema.pre(/^find/, function (next) {
  (this as any).find({ archive: { $ne: true } });
  next();
});
groupSchema.pre(/^find/, function (next) {
  this.populate({
    path: "supervisor",
    select: "firstName lastName email role department  phoneNumber",
  }).populate({
    path: "users",
    select: "firstName lastName email role department matricNumber phoneNumber",
  });
  next();
});
const Group = mongoose.model("Group", groupSchema);

export default Group;
