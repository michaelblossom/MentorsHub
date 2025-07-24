// Signup User
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { IGroup } from "../interfaces/group.interface";
import Group from "../models/group.model";
import User from "../models/user.model";

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
    res.status(201).json({
      status: "success",
      data: {
        group: newGroup,
      },
    });
  }
);
export default { createGroup };
