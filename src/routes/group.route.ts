import express from "express";
import groupController from "./../controllers/group.controller";
import Protected from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/", Protected, groupController.createGroup);
router.post("/addUser-to-group", Protected, groupController.addUserToGroup);
router.post(
  "/removeUser-from-group",
  Protected,
  groupController.removeUserFromGroup
);

export default router;
