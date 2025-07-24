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
    const id = (req as any).user.id;
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
    const userName = req.body.mentorUserName;
    const mentor = await User.findOne({ userName: userName });
    if (!mentor) {
      return next(
        new AppError(`No mentor found with this username:${userName}`, 400)
      );
    }

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
      await User.findByIdAndDelete(newGroup.id);
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }
  }
);

const addUserToGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).user.id;
    const { groupId, userId } = req.body;

    //Validate input IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new AppError(`Invalid group or user ID`, 400));
    }

    // Find the group
    let group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError(`No group found with this ID:${groupId}`, 400));
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(`No user found with this ID:${userId}`, 400));
    } else if (user.role !== "mentee(student)") {
      return next(
        new AppError(
          `It's Only mentees(students) that can be added to :${group.name}`,
          400
        )
      );
    }

    // Check if user is already in group
    if (group.users.includes(user._id)) {
      return next(new AppError(`User already in group`, 400));
    }

    // Check if users in the group are up to 3
    if (group.users.length >= group.maximunGroupSize) {
      return next(
        new AppError(
          `${groupId.name} has reached its maximum number of users:`,
          400
        )
      );
    }
    // Find the user
    const currentUser = await User.findById(id);
    if (currentUser?.role !== "admin") {
      return next(
        new AppError("you do not have permission to perforn this action", 403)
      );
    }

    // Add user to group
    group = await Group.findByIdAndUpdate(
      groupId,
      { $push: { users: userId } },
      { new: true }
    );

    try {
      await sendEmail({
        email: user.email,
        subject: "Project Group Notification",
        html: `<h1> Hi ${user.firstName} ${user.lastName}, you have been added to : ${group.name}<h1>`,
      });
      // sending response
      res.status(201).json({
        status: "success",
        data: {
          group: group,
        },
      });
    } catch (error) {
      await Group.findByIdAndUpdate(
        groupId,
        { $pull: { users: userId } },
        { new: true }
      );
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }
  }
);

export default { createGroup, addUserToGroup };
// } catch (error) {
//     console.error("Error adding user to group:", error);
//     return res.status(500).json({ message: "Server error", error })
