import express from "express";
import projectController from "./../controllers/project.controller";
import Protected from "../middlewares/auth.middleware";
import { restrict } from "./../middlewares/restrictions";

import uploadDocumentsControllers from "../controllers/uploadDocuments.controllers";
const router = express.Router();

router.use(Protected); // this will protect all the middlewares under it from users that are not logged in

router.post("/", restrict("student"), projectController.createProject);
router.get("/", projectController.getAllProjects);
router.patch(
  "/:id",

  uploadDocumentsControllers.uploadUserDocument,
  projectController.updateProject
);
router.get("/detail", projectController.getProjectByUser);
router.get("/:id", projectController.getProject);
router.get(
  "/project-in-group/:groupId",

  projectController.getProjectByGroup
);

export default router;
