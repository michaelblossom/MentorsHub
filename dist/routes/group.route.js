"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const group_controller_1 = __importDefault(require("./../controllers/group.controller"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const router = express_1.default.Router();
router.post("/", auth_middleware_1.default, group_controller_1.default.createGroup);
router.get("/", auth_middleware_1.default, group_controller_1.default.getAllGroups);
router.post("/addUser-to-group", auth_middleware_1.default, group_controller_1.default.addUserToGroup);
router.post("/removeUser-from-group", auth_middleware_1.default, group_controller_1.default.removeUserFromGroup);
exports.default = router;
