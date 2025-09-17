import express from "express";
import groupController from "./../controllers/group.controller";
import Protected from "../middlewares/auth.middleware";
const router = express.Router();

router.use(Protected);

router.post("/", groupController.createGroup);
router.get("/", groupController.getAllGroups);
router.post("/add-to-group", groupController.addUserToGroup);
router.post(
  "/remove-from-group",

  groupController.removeUserFromGroup
);
router.patch("/archive-group/:id", groupController.archiveGroup);

router.get("/:id", groupController.getGroup);

router.get("/get-group-stats", groupController.getGroupStats);

export default router;
