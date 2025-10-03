import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import Group from "../models/group.model";
import { IGroup } from "../interfaces/group.interface";
import User from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import mongoose from "mongoose";
import { runInNewContext } from "vm";
import sendEmail from "../utils/email";

// get All groups

const getAllGroups = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // filtering the query
    const queryObj = { ...req.query };
    const excludedFields: string[] = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((exfields) => delete queryObj[exfields]);

    // advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // const books = await Book.find(queryObj);
    let query = Group.find(JSON.parse(queryStr));

    // SORTING
    if (req.query.sort) {
      const sortBy = (req.query.sort as any).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query.sort("-createdAt");
    }

    // FIELD LIMITING

    if (req.query.fields) {
      const fields = (req.query.fields as any).split(",").join(" ");
      query = query.select(fields);
    } else {
      query.select("-__v");
    }

    // PAGINATION
    const page: number = Number(req.query.page) || 1;
    const limit: number = Number(req.query.limit) || 100;
    const skip: number = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numGroups = await Group.estimatedDocumentCount();
      if (skip >= numGroups) {
        return next(new AppError("The page you request does not exist", 404));
      }
    }

    // executing the query
    const groups = await query;

    res.status(200).json({
      status: "success",
      result: groups.length,

      data: {
        groups: groups,
      },
    });
  }
);

const createGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const group: Partial<IGroup> = {
      name: req.body.name,
      maximumGroupSize: req.body.maximumGroupSize,
    };

    try {
      const newGroup = await Group.create(group);

      if (!newGroup) {
        return next(
          new AppError(`Error creating group! Please try again`, 400)
        );
      }

      return res.status(201).json({
        status: "success",
        message: "Group was successfully created",
        data: {
          group: newGroup,
        },
      });
    } catch (error: any) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return next(new AppError(`Group  already exists`, 400));
      }
      console.log(error);

      return next(
        new AppError("An unexpected error occurred. Please try again.", 500)
      );
    }
  }
);

export const addUserToGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupId, userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new AppError(`Invalid group or user ID`, 400));
    }

    const user = await User.findById(userId);
    if (!user) return next(new AppError(`No user found`, 404));

    if (user.role === "admin" || user.role === "supervisor") {
      return next(new AppError(`Only students can be added to groups`, 400));
    }

    // Update group safely (atomic operation)
    const updatedGroup = await Group.findOneAndUpdate(
      { _id: groupId, users: { $ne: userId } }, // ensure user not already in group
      { $addToSet: { users: userId } }, // add user if not exists
      { new: true }
    );

    if (!updatedGroup) {
      return next(new AppError("User already in this group ", 400));
    }

    try {
      await sendEmail({
        email: user.email,
        subject: "Project Group Notification",
        html: `<h1>Hi ${user.firstName} ${user.lastName}, you have been added to ${updatedGroup.name}</h1>`,
      });

      res.status(201).json({
        status: "success",
        message: "User successfully added to group",
        data: { group: updatedGroup },
      });
    } catch (error) {
      // Rollback if email fails
      await Group.findByIdAndUpdate(
        groupId,
        { $pull: { users: userId } },
        { new: true }
      );
      return next(new AppError("Error sending email. Try again.", 500));
    }
  }
);
const removeUserFromGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupId, userId } = req.body;

    // Validate group and user IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new AppError(`Invalid group or user ID`, 400));
    }

    // Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError(`No group found`, 404));
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(`User not found`, 404));
    }

    // Ensure proper ObjectId comparison
    const userIndex = group.users.findIndex((id: mongoose.Types.ObjectId) =>
      id.equals(user._id)
    );

    if (userIndex === -1) {
      return next(new AppError(`User not found in the group`, 404));
    }

    // Remove user
    group.users.splice(userIndex, 1);
    await group.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "Project Group Notification",
        html: `<h1>Hi ${user.firstName} ${user.lastName}, you have been removed from ${group.name}</h1>`,
      });

      return res.status(200).json({
        status: "success",
        message: "User successfully removed from group",
        data: { group },
      });
    } catch (error) {
      // Rollback on email failure
      group.users.push(user._id);
      await group.save();

      return next(
        new AppError("There was an error sending the email. Try again", 500)
      );
    }
  }
);

//Assign supervisor to a group
export const assignSupervisor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupId, supervisorId } = req.body;

    // 1. Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError("Group not found", 404));
    }

    // 2. Check if group already has a supervisor
    if (group.supervisor) {
      return next(new AppError("This group already has a supervisor", 400));
    }

    // 3. check if supervisor exist
    const supervisor = await User.findById(supervisorId);
    if (!supervisor) {
      return next(new AppError("Supervisor not found", 404));
    }

    // 4. Ensure user role is supervisor
    if (supervisor.role !== "supervisor") {
      return next(new AppError("This user is not a supervisor", 400));
    }

    // 5. Check if supervisor already exists in the group users
    if (group.users.includes(supervisor._id)) {
      return next(
        new AppError("Supervisor already exists in this group as a user", 400)
      );
    }

    // 6. Check if group has reached maximum size
    if (group.users.length >= group.maximumGroupSize) {
      return next(new AppError("This group has reached its maximum size", 400));
    }

    // 7. Assign supervisor
    group.supervisor = supervisor._id;
    await group.save();

    try {
      await sendEmail({
        email: supervisor.email,
        subject: "Project Group Notification",
        html: `<h1>Hi ${supervisor.firstName} ${supervisor.lastName}, you have been assigned to supervise  ${group.name}</h1>`,
      });

      res.status(200).json({
        status: "success",
        message: "Supervisor assigned successfully",
        data: {
          group,
        },
      });
    } catch (error) {
      // Rollback on email failure
      group.supervisor.pop(supervisor._id);
      await group.save();

      return next(
        new AppError("There was an error sending the email. Try again", 500)
      );
    }
  }
);

// archiving  a group
const archiveGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return next(new AppError("No group found", 404));
    }

    await Group.findByIdAndUpdate(req.params.id, {
      archive: true,
    });
    res.status(204).json({
      status: "success",
      message: "Group is no longer active",
      data: null,
    });
  }
);
const getGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const group = await Group.findById(req.params.id).populate({
      path: "users",
      select:
        "-__v -passwo -rdResetOTP -passwordResetOTPExpires -passwordResetOTP -otp -otpExpires -createdAt -updatedAt",
    });
    if (!group) {
      return next(new AppError("No group found ", 404));
    }
    // destructuring the group
    const { createdAt, updatedAt, __v, ...rest } = group.toObject();
    res.status(200).json({
      status: "success",
      data: {
        group: rest,
      },
    });
  }
);

const getGroupStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await Group.aggregate([
      {
        // $facet will enable us to run multiple pipelines at a time( the pipelines are totalGrous,archivedGroups)
        $facet: {
          //count the number of elements in Groups model and store the value in count variable
          totalGroups: [{ $count: "count" }],
          //count the number of elements in Groups model whose archive field value is true and store the value in count variable

          archivedGroups: [
            { $match: { archive: { $ne: false } } },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          totalGroups: {
            // $arrayElemAt allows us to get the value of an array in a specified index
            $ifNull: [{ $arrayElemAt: ["$totalGroups.count", 0] }, 0], // $ifNull allow us to set a value if the expected value is null
          },
          archivedGroups: {
            $ifNull: [{ $arrayElemAt: ["$archivedGroups.count", 0] }, 0],
          },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: stats[0] || { totalGroups: 0, archivedGroups: 0 },
    });
  }
);

export default {
  createGroup,
  addUserToGroup,
  removeUserFromGroup,
  assignSupervisor,
  getAllGroups,
  archiveGroup,
  getGroup,
  getGroupStats,
};
