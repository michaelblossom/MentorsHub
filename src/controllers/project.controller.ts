import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import Group from "../models/group.model";
import { IProject } from "../interfaces/project.interface";
import Project from "../models/project.model";
import User from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import mongoose from "mongoose";
import sendEmail from "../utils/email";

// functions that will filter out fields tha we dont want to update
const filterObj = (obj: any, ...allowedFields: string[]) => {
  const newObj: { [key: string]: any } = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// get All groups
const getAllProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).user.id;
    // check if the user fetching all the projects is a supervisor
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(`No user found with this ID:${id}`, 400));
    }
    console.log(user);
    if (user?.role !== "supervisor") {
      return next(
        new AppError("you do not have permission to perforn this action", 403)
      );
    }
    const projects = await Project.find();

    res.status(200).json({
      status: "success",
      result: projects.length,

      data: {
        projects: projects,
      },
    });
  }
);
const createProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).user.id;
    const { topic, description, groupId } = req.body;

    // check if the user creating a project is a student
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(`No user found with this ID:${id}`, 400));
    }
    if (user?.role !== "student") {
      return next(
        new AppError("you do not have permission to perforn this action", 403)
      );
    }
    // checking if the ObjectId provided is valid
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new AppError(`Invalid group  ID`, 400));
    }

    const projectExists = await Project.findOne({ topic });
    // console.log(`please show list of projects${projectExists}`);

    // check if topic already exist
    if (projectExists?.topic) {
      return next(new AppError(`Project ${topic} already exists`, 400));
    }

    // check if group exist
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError(`No group found with this ID:${groupId}`, 400));
    }

    //check if user exist in the group
    const userExists = group.users.some(
      (user: any) => user._id.toString() === id
    );

    if (!userExists) {
      return next(
        new AppError(`User does not exist in  group :${group.name}`, 400)
      );
    }

    const project: Partial<IProject> = {
      description,
      topic,
      userId: id,
      groupId,
    };
    const newProject = await Project.create(project);

    if (!newProject) {
      return next(
        new AppError(`Error creating Project! Please try again`, 400)
      );
    }
    //getting the supervisor of the group in which a member wants to create project
    const supervisor = await User.findById(group.supervisor);

    if (!supervisor) {
      return next(new AppError(`No supervisor found with this `, 400));
    }

    try {
      await sendEmail({
        email: supervisor.email,
        subject: "Project Submission Notification",
        html: `<h1> Hi Mr ${supervisor.firstName} ${supervisor.lastName}, ${user.firstName} ${user.lastName} from ${group.name} just submitted a project with the topic: "${newProject.topic}"  please review for approval<h1>`,
      });
      // sending response
      res.status(201).json({
        status: "success",
        message: "Project was successfully Submitted",
        data: {
          group: newProject,
        },
      });
    } catch (error) {
      await Project.findByIdAndDelete(newProject.id);
      return next(
        new AppError("There is an error in sending the mail. Try again", 500)
      );
    }
  }
);

const updateProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const project = await Project.findById(req.params.id);
    //check if project exist
    if (!project) {
      return new AppError('No Project found', 400);
    }
    if (project.userId.toString() !== (req as any).user.id) {
      return next(
        new AppError('You do not have permission to update this project', 403)
      );
    }

    if (req.body.status) {
      return next(
        new AppError(
          'this route is not for status  update please use  updateMyProject route',
          400
        )
      );
    }

    // 2)filtering out the unwanted field names that are not allowed to be updated by calling the filterObj function and storing it in filteredBody
    const filteredBody = filterObj(req.body, 'file', 'topic', 'stage');
    if (req.file) filteredBody.file = req.file.filename; //saving the name of the newly updated file to file filed
    // 3)update the project document
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject,
      },
    });
  }
);
export default {
  createProject,
  getAllProjects,
  updateProject,
};
