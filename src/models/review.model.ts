import mongoose from "mongoose";
import { IReview } from "./../interfaces/review.interface";
const reviewSchema = new mongoose.Schema<IReview>(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Review must belong to a projec topic."],
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must come from a mentor."],
    },
  },

  { timestamps: true }
);
const Review = mongoose.model("Review", reviewSchema);

export default Review;
