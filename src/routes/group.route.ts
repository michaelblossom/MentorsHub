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

  groupController.removeUserFromGroup
);
router.patch(
  "/archive-group/:id",
  restrict("admin"),
  groupController.archiveGroup
);

router.get("/:id", groupController.getGroup);

router.get(
  "/get-group-stats",
  restrict("admin"),
  groupController.getGroupStats
);

export default router;
