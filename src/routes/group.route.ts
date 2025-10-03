import express from "express";
import groupController from "./../controllers/group.controller";
import Protected from "../middlewares/auth.middleware";
import { restrict } from "./../middlewares/restrictions";
const router = express.Router();

router.use(Protected);
router.get("/", restrict("admin"), groupController.getAllGroups);

router.post("/", restrict("admin"), groupController.createGroup);
router.post("/add-to-group", restrict("admin"), groupController.addUserToGroup);
router.post(
  "/remove-from-group",
  restrict("admin"),
  groupController.removeUserFromGroup
);
router.post(
  "/assign-supervisor",
  restrict("admin"),
  groupController.assignSupervisor
);
router.get(
  "/get-group-stats",
  restrict("admin"),
  groupController.getGroupStats
);
router.patch(
  "/archive-group/:id",
  restrict("admin"),
  groupController.archiveGroup
);

router.get("/:id", restrict("admin"), groupController.getGroup);

export default router;
