import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { IProject } from '../interfaces/project.interface';
import Project from '../models/project.model';
import Group from '../models/group.model';
import User from '../models/user.model';
import sendEmail from '../utils/email';

const createProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).user.id;
    const { name, topic, groupId } = req.body;

    // check if the user creating a project is a student
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(`No user found with this ID:${id}`, 400));
    }
    console.log(user);
    if (user?.role !== 'student') {
      return next(
        new AppError('you do not have permission to perforn this action', 403)
      );
    }
    // checking if the ObjectIds provided is valid
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

    console.log(userExists);

    const project: Partial<IProject> = {
      name,
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
        subject: 'Project Submission Notification',
        html: `<h1> Hi Mr ${supervisor.firstName} ${supervisor.lastName}, ${user.firstName} ${user.lastName} from ${group.name} just submitted a project with the topic: "${newProject.topic}"  please review for approval<h1>`,
      });
      // sending response
      res.status(201).json({
        status: 'success',
        message: 'Project was successfully Submitted',
        data: {
          group: newProject,
        },
      });
    } catch (error) {
      await User.findByIdAndDelete(newProject.id);
      return next(
        new AppError('There is an error in sending the mail. Try again', 500)
      );
    }
  }
);
export default {
  createProject,
};
