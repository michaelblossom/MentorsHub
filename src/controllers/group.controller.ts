import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { IGroup } from "../interfaces/group.interface";
import Group from "../models/group.model";
import User from "../models/user.model";
import sendEmail from "../utils/email";
import { runInNewContext } from "vm";

const createGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let name = req.body.name;

    const exists = await Group.findOne({ name });

    if (exists?.name) {
      return next(new AppError(`Group ${name} already exists`, 400));
    }

    const group: Partial<IGroup> = {
      name,
      mentor: req.body.mentor,
      mentorUserName: req.body.mentorUserName,
      maximunGroupSize: req.body.maximunGroupSize,
    };
    const id = (req as any).user.id;
    const user = await User.findById(id);
    // console.log(user);
    if (user?.role !== "admin") {
      return next(
        new AppError("you do not have permission to perforn this action", 403)
      );
    }
    const newGroup = await Group.create(group);

    if (!newGroup) {
      return next(new AppError(`Error creating Group! Please try again`, 400));
    }
    const mentor = await User.findOne({ userName: req.body.mentorUserName });

    // console.log(mentor);
    try {
      await sendEmail({
        email: mentor.email,
        subject: "Group Mentorship Notification",
        html: `<h1> Hi ${mentor.firstName} ${mentor.lastName}, you have been assigned to Mentor: ${newGroup.name}<h1>`,
      });
      // sending response
      res.status(201).json({
        status: "success",
        data: {
          group: newGroup,
        },
      });
    } catch (error) {
      await User.findByIdAndDelete(newGroup._id);
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }
  }
);
export default { createGroup };
