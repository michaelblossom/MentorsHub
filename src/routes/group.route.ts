import express from "express";
import groupController from "./../controllers/group.controller";
import Protected from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/", Protected, groupController.createGroup);
router.get("/", Protected, groupController.getAllGroups);
router.post("/add-to-group", Protected, groupController.addUserToGroup);
router.post(
  "/remove-from-group",
  Protected,
  groupController.removeUserFromGroup
);
router.patch("/archive-group/:id", Protected, groupController.archiveGroup);

router.get("/get-group-stats", groupController.getGroupStats);

export default router;
