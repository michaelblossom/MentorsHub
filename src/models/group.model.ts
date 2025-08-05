import mongoose from "mongoose";
import { IGroup } from "../interfaces/group.interface";

const groupSchema = new mongoose.Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, "please provide group name "],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Group must have a supervisor."],
    },
    maximumGroupSize: {
      type: Number,
      required: [true, "A group must have a group size"],
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
  (this as any).find({ archive: { $ne: false } });
  next();
});
// groupSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "supervisor",
//     select: "firstName lastName email role",
//   }).populate({
//     path: "users",
//     select: "firstName lastName email role",
//   });
//   next();
// });
const Group = mongoose.model("Group", groupSchema);

export default Group;
