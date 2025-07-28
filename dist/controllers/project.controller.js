"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const appError_1 = __importDefault(require("../utils/appError"));
const project_model_1 = __importDefault(require("../models/project.model"));
const group_model_1 = __importDefault(require("../models/group.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_1 = __importDefault(require("../utils/email"));
const createProject = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.user.id;
    const { name, topic, groupId } = req.body;
    // check if the user creating a project is a mentee(student)
    const user = yield user_model_1.default.findById(id);
    if (!user) {
        return next(new appError_1.default(`No user found with this ID:${id}`, 400));
    }
    console.log(user);
    if ((user === null || user === void 0 ? void 0 : user.role) !== "mentee(student)") {
        return next(new appError_1.default("you do not have permission to perforn this action", 403));
    }
    // checking if the ObjectIds provided is valid
    if (!mongoose_1.default.Types.ObjectId.isValid(groupId)) {
        return next(new appError_1.default(`Invalid group  ID`, 400));
    }
    const projectExists = yield project_model_1.default.findOne({ topic });
    // console.log(`please show list of projects${projectExists}`);
    // check if topic already exist
    if (projectExists === null || projectExists === void 0 ? void 0 : projectExists.topic) {
        return next(new appError_1.default(`Project ${topic} already exists`, 400));
    }
    // check if group exist
    const group = yield group_model_1.default.findById(groupId);
    if (!group) {
        return next(new appError_1.default(`No group found with this ID:${groupId}`, 400));
    }
    //check if user exist in the group
    const userExists = group.users.some((user) => user._id.toString() === id);
    if (!userExists) {
        return next(new appError_1.default(`User does not exist in  group :${group.name}`, 400));
    }
    console.log(userExists);
    const project = {
        name,
        topic,
        userId: id,
        groupId,
    };
    const newProject = yield project_model_1.default.create(project);
    if (!newProject) {
        return next(new appError_1.default(`Error creating Project! Please try again`, 400));
    }
    //getting the mentor of the group in which a member wants to create project
    const mentor = yield user_model_1.default.findById(group.mentor);
    if (!mentor) {
        return next(new appError_1.default(`No mentor found with this `, 400));
    }
    // console.log(mentor);
    try {
        yield (0, email_1.default)({
            email: mentor.email,
            subject: "Project Submission Notification",
            html: `<h1> Hi Mr ${mentor.firstName} ${mentor.lastName}, ${user.firstName} ${user.lastName} from${group.name} just submitted a project with the topic: "${newProject.topic}"  please review for approval<h1>`,
        });
        // sending response
        res.status(201).json({
            status: "success",
            message: "Project was successfully Submitted",
            data: {
                group: newProject,
            },
        });
    }
    catch (error) {
        yield user_model_1.default.findByIdAndDelete(newProject.id);
        return next(new appError_1.default("There is an error in sending the mail. Try again", 500));
    }
}));
exports.default = {
    createProject,
};
