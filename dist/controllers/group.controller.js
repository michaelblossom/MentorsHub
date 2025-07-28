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
const group_model_1 = __importDefault(require("../models/group.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_1 = __importDefault(require("../utils/email"));
// get All groups
const getAllGroups = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield group_model_1.default.find();
    res.status(200).json({
        status: "success",
        result: groups.length,
        data: {
            groups: groups,
        },
    });
}));
const createGroup = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.user.id;
    // const mentorId = req.body.mentor;
    const { name, mentorId, maximunGroupSize } = req.body;
    // checking if the ObjectId provided is valid
    if (!mongoose_1.default.Types.ObjectId.isValid(mentorId)) {
        return next(new appError_1.default(`Invalid mentor ID`, 400));
    }
    const exists = yield group_model_1.default.findOne({ name });
    if (exists === null || exists === void 0 ? void 0 : exists.name) {
        return next(new appError_1.default(`Group ${name} already exists`, 400));
    }
    const group = {
        name,
        mentor: req.body.mentor,
        maximunGroupSize: req.body.maximunGroupSize,
    };
    const user = yield user_model_1.default.findById(id);
    // console.log(user);
    if ((user === null || user === void 0 ? void 0 : user.role) !== "admin") {
        return next(new appError_1.default("you do not have permission to perforn this action", 403));
    }
    const newGroup = yield group_model_1.default.create(group);
    if (!newGroup) {
        return next(new appError_1.default(`Error creating Group! Please try again`, 400));
    }
    const mentor = yield user_model_1.default.findById(mentorId);
    if (!mentor) {
        return next(new appError_1.default(`No mentor found with this name:${mentor.name}`, 400));
    }
    // console.log(mentor);
    try {
        yield (0, email_1.default)({
            email: mentor.email,
            subject: "Group Mentorship Notification",
            html: `<h1> Hi ${mentor.firstName} ${mentor.lastName}, you have been assigned to Mentor: ${newGroup.name}<h1>`,
        });
        // sending response
        res.status(201).json({
            status: "success",
            message: "Group was successfully Created",
            data: {
                group: newGroup,
            },
        });
    }
    catch (error) {
        yield user_model_1.default.findByIdAndDelete(newGroup.id);
        return next(new appError_1.default("There is an error in sending the mail. Try again", 500));
    }
}));
const addUserToGroup = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.user.id;
    // Find the current user
    const currentUser = yield user_model_1.default.findById(id);
    // check if the current user that want to perform the action is an admin
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) !== "admin") {
        return next(new appError_1.default("you do not have permission to perforn this action", 403));
    }
    const { groupId, userId } = req.body;
    //Validate input IDs
    if (!mongoose_1.default.Types.ObjectId.isValid(groupId) ||
        !mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return next(new appError_1.default(`Invalid group or user ID`, 400));
    }
    // Find the group that the user will be added in
    let group = yield group_model_1.default.findById(groupId);
    if (!group) {
        return next(new appError_1.default(`No group found with this ID:${groupId}`, 400));
    }
    // Find the user to be added to the group
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        return next(new appError_1.default(`No user found with this ID:${userId}`, 400));
    }
    else if (user.role !== "mentee(student)") {
        return next(new appError_1.default(`It's Only mentees(students) that can be added to :${group.name}`, 400));
    }
    // Check if user is already in group
    if (group.users.includes(user._id)) {
        return next(new appError_1.default(`User already in group`, 400));
    }
    // Check if users in the group are up to 3
    if (group.users.length >= group.maximunGroupSize) {
        return next(new appError_1.default(`${groupId.name} has reached its maximum number of users:`, 400));
    }
    // Add user to group
    group = yield group_model_1.default.findByIdAndUpdate(groupId, { $push: { users: userId } }, { new: true });
    try {
        yield (0, email_1.default)({
            email: user.email,
            subject: "Project Group Notification",
            html: `<h1> Hi ${user.firstName} ${user.lastName}, you have been added to : ${group.name}<h1>`,
        });
        // sending response
        res.status(201).json({
            status: "success",
            message: "User successfully removed from group",
            data: {
                group: group,
            },
        });
    }
    catch (error) {
        // if there is an error sending the email, remove the user from the group
        yield group_model_1.default.findByIdAndUpdate(groupId, { $pull: { users: userId } }, { new: true });
        return next(new appError_1.default("There is an error in sending the mail. Try again", 500));
    }
}));
const removeUserFromGroup = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    //getting the id of the currently logged in use
    const id = req.user.id;
    // Find the current user
    const currentUser = yield user_model_1.default.findById(id);
    // check if the current user that want to perform the action is an admin
    if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) !== "admin") {
        return next(new appError_1.default("you do not have permission to perforn this action", 403));
    }
    //getting the groupId and UserId from the body
    const { groupId, userId } = req.body;
    // checking if the ObjectIds provided is valid
    if (!mongoose_1.default.Types.ObjectId.isValid(groupId) ||
        !mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return next(new appError_1.default(`Invalid group or user ID`, 400));
    }
    //Check if group exists
    const group = yield group_model_1.default.findById(groupId);
    if (!group) {
        return next(new appError_1.default(`No group found with this ID:${groupId}`, 400));
    }
    // Check if user exists
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        return next(new appError_1.default(`No user found with this ID:${userId}`, 400));
    }
    // Check if user is actually in the group and also get the index of the user in the users array
    const userIndex = group.users.findIndex((id) => id.toString() === user._id.toString());
    // console.log(userIndex);
    if (userIndex === -1) {
        return next(new appError_1.default(`User with ID:${userId} is not in this group `, 400));
    }
    // Remove the user from the group
    group.users.splice(userIndex, 1);
    yield group.save();
    try {
        yield (0, email_1.default)({
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
    }
    catch (error) {
        // if there is an error sending email, add the user back to the group
        yield group_model_1.default.findByIdAndUpdate(groupId, { $push: { users: userId } }, { new: true });
        return next(new appError_1.default("There is an error in sending the mail. Try again", 500));
    }
    return res.status(200).json({
        message: "User successfully removed from group",
        group,
    });
}));
exports.default = {
    createGroup,
    addUserToGroup,
    removeUserFromGroup,
    getAllGroups,
};
