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
    const groups = await Group.find();
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

    const newGroup = await Group.create(group);
    // const userId = (req as any).user.id;

    // const user = await User.findById(userId);
    // if (!user || user.role !== "admin") {
    //   return next(
    //     new AppError("You do not have permission to perform this action", 403)
    //   );
    // }

    // const { name, maximumGroupSize } = req.body;

    try {
      // const newGroup = await Group.create({
      //   name,
      //   maximumGroupSize,
      // });
      const created = await Group.create(group);

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

const addUserToGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupId, userId } = req.body;

    //Validate input IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new AppError(`Invalid group or user ID`, 400));
    }

    // Find the group that the user will be added in
    let group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError(`No group found with this ID:${groupId}`, 400));
    }

    // Find the user to be added to the group
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(`No user found with this ID:${userId}`, 400));
    }

    if (user.role === "admin") {
      return next(
        new AppError(
          `Only students and supervisors that can be added to :${group.name}`,
          400
        )
      );
    }
    // Check if user is a supervisor and add them to the group
    if (user.role === "supervisor") {
      if (group.supervisor) {
        return next(
          new AppError(`Group already has a supervisor: ${group.name}`, 400)
        );
      }

      const addedSupervisor = await Group.findByIdAndUpdate(
        groupId,
        { $set: { supervisor: userId } },
        { new: true, runValidators: true }
      );

      try {
        await sendEmail({
          email: user.email,
          subject: "Project Group Notification",
          html: `<h1> Hi ${user.firstName} ${user.lastName}, you have been added to : ${group.name}<h1>`,
        });

        return res.status(201).json({
          status: "success",
          message: "Supervisor successfully added to group",
          data: {
            group: addedSupervisor,
          },
        });
      } catch (error) {
        await Group.findByIdAndUpdate(
          groupId,
          { $pull: { supervisor: userId } },
          { new: true }
        );
        return next(
          new AppError("There is an error in sending the mail. Try again", 500)
        );
      }
    }

    // Check if user is already in group
    if (group.users.includes(user._id)) {
      return next(new AppError(`User already in group`, 400));
    }

    // Check if users in the group are up to 3
    if (group.users.length >= group.maximumGroupSize) {
      return next(
        new AppError(
          `${groupId.name} has reached it's maximum number of users:`,
          400
        )
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
        message: "User successfully added from group",
        data: {
          group: group,
        },
      });
    } catch (error) {
      // if there is an error sending the email, remove the user from the group
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

const removeUserFromGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //getting the groupId and UserId from the body
    const { groupId, userId } = req.body;

    // checking if the ObjectIds provided is valid
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new AppError(`Invalid group or user ID`, 400));
    }

    //Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError(`No group found with this ID:${groupId}`, 400));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(`No user found with this ID:${userId}`, 400));
    }

    // Check if user is actually in the group and also get the index of the user in the users array
    const userIndex = group.users.findIndex(
      (id: any) => id.toString() === user._id.toString()
    );

    if (userIndex === -1) {
      return next(
        new AppError(`User with ID:${userId} is not in this group `, 400)
      );
    }

    // Remove the user from the group
    group.users.splice(userIndex, 1);
    await group.save();
    try {
      await sendEmail({
        email: user.email,
        subject: "Project Group Notification",
        html: `<h1> Hi ${user.firstName} ${user.lastName}, you have been removed from : ${group.name}<h1>`,
      });
      // sending response
      res.status(201).json({
        status: "success",
        message: "User successfully removed from group",
        data: {
          group: group,
        },
      });
    } catch (error) {
      // if there is an error sending email, add the user back to the group
      await Group.findByIdAndUpdate(
        groupId,
        { $push: { users: userId } },
        { new: true }
      );
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }

    return res.status(200).json({
      message: "User successfully removed from group",
      group,
    });
  }
);
// archiving  a group
const archiveGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return next(new AppError("No group found", 404));
    }
    if (group.archive == true) {
      return next(new AppError("Group ia archived already", 404));
    }
    await Group.findByIdAndUpdate(req.params.id, { archive: false });
    res.status(204).json({
      status: "success",
      message: "Group is no longer active",
      data: group,
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
            // $arrayElemAt allows us to the value of an array in a specified index
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
  getAllGroups,
  archiveGroup,
  getGroup,
  getGroupStats,
};
