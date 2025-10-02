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

// const addUserToGroup = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { groupId, userId } = req.body;

//     //Validate input IDs
//     if (
//       !mongoose.Types.ObjectId.isValid(groupId) ||
//       !mongoose.Types.ObjectId.isValid(userId)
//     ) {
//       return next(new AppError(`Invalid group or user ID`, 400));
//     }

//     // Find the group that the user will be added in
//     let group = await Group.findById(groupId);
//     if (!group) {
//       return next(new AppError(`No group found with this ID:${groupId}`, 404));
//     }

//     // Find the user to be added to the group
//     const user = await User.findById(userId);
//     if (!user) {
//       return next(new AppError(`No user found with this ID:${userId}`, 404));
//     }

//     if (user.role === "admin") {
//       return next(
//         new AppError(
//           `Only students and supervisors that can be added to :${group.name}`,
//           400
//         )
//       );
//     }
//     // // Check if user is a supervisor and add them to the group
//     if (user.role === "supervisor") {
//       if (group.supervisor) {
//         return next(
//           new AppError(`Group ${group.name} already has a supervisor: `, 400)
//         );
//       }

//       const addedSupervisor = await Group.findByIdAndUpdate(
//         groupId,
//         { $set: { supervisor: userId } },
//         { new: true, runValidators: true }
//       );

//       try {
//         await sendEmail({
//           email: user.email,
//           subject: "Project Group Notification",
//           html: `<h1> Hi ${user.firstName} ${user.lastName}, you have been added to : ${group.name}<h1>`,
//         });

//         return res.status(201).json({
//           status: "success",
//           message: "Supervisor successfully added to group",
//           data: {
//             group: addedSupervisor,
//           },
//         });
//       } catch (error) {
//         // await Group.findByIdAndUpdate(
//         //   groupId,
//         //   { $pull: { supervisor: userId } },
//         //   { new: true }
//         // );
//         group = await Group.findByIdAndUpdate(
//           groupId,
//           { $addToSet: { users: userId } },
//           { new: true }
//         );
//         return next(
//           new AppError("There is an error in sending the mail. Try again", 500)
//         );
//       }
//     }

//     // Check if user is already in group
//     // if (group.users.includes(user._id)) {
//     //   return next(new AppError(`User already in group`, 400));
//     // }
//     if (group.users.some((u: any) => u.toString() === user._id.toString())) {
//       return next(new AppError(`User already in group`, 400));
//     }

//     // Check if users in the group are up to 3
//     if (group.users.length >= group.maximumGroupSize) {
//       return next(
//         new AppError(
//           `${groupId.name} has reached it's maximum number of users:`,
//           400
//         )
//       );
//     }

//     // Add user to group
//     group = await Group.findByIdAndUpdate(
//       groupId,
//       { $push: { users: userId } },
//       { new: true }
//     );

//     try {
//       await sendEmail({
//         email: user.email,
//         subject: "Project Group Notification",
//         html: `<h1> Hi ${user.firstName} ${user.lastName}, you have been added to : ${group.name}<h1>`,
//       });
//       // sending response
//       res.status(201).json({
//         status: "success",
//         message: "User successfully added from group",
//         data: {
//           group: group,
//         },
//       });
//     } catch (error) {
//       // if there is an error sending the email, remove the user from the group
//       await Group.findByIdAndUpdate(
//         groupId,
//         { $pull: { users: userId } },
//         { new: true }
//       );
//       return next(
//         new AppError("There is an error in sending the mail. Try again", 500)
//       );
//     }
//   }
// );
export const addUserToGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupId, userId } = req.body;

    // Validate input IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return next(new AppError(`Invalid group or user ID`, 400));
    }

    // Find the group
    let group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError(`No group found `, 404));
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(`No user found `, 404));
    }

    // Prevent adding admin or supervisor
    if (user.role === "admin" || user.role === "supervisor") {
      return next(
        new AppError(`Only students can be added to group: ${group.name}`, 400)
      );
    }

    // Check if user already exists in group
    const alreadyInGroup = group.users.some(
      (u: any) => u.toString() === user._id.toString()
    );
    if (alreadyInGroup) {
      return next(new AppError(`User already in this group`, 400));
    }

    // Check group capacity
    if (group.users.length >= group.maximumGroupSize) {
      return next(
        new AppError(
          `Group ${group.name} has reached its maximum capacity`,
          400
        )
      );
    }

    // Add user to group
    group.users.push(user._id);
    await group.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "Project Group Notification",
        html: `<h1>Hi ${user.firstName} ${user.lastName}, you have been added to ${group.name}</h1>`,
      });

      res.status(201).json({
        status: "success",
        message: "User successfully added to group",
        data: { group },
      });
    } catch (error) {
      // rollback if email fails
      group.users = group.users.filter(
        (u: any) => u.toString() !== user._id.toString()
      );
      await group.save();

      return next(
        new AppError("There was an error sending the email. Try again", 500)
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
      return next(new AppError(`No group found `, 404));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError(`User not found`, 404));
    }

    // Check if user is actually in the group and also get the index of the user in the users array
    const userIndex = group.users.findIndex(
      (id: any) => id.toString() === user._id.toString()
    );

    if (userIndex === -1) {
      return next(new AppError(`User not found in the group `, 404));
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
  getAllGroups,
  archiveGroup,
  getGroup,
  getGroupStats,
};
