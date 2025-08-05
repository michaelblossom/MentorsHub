import express from "express";
import projectController from "./../controllers/project.controller";
import Protected from "../middlewares/auth.middleware";
import uploadDocumentsControllers from "../controllers/uploadDocuments.controllers";
const router = express.Router();

router.post("/", Protected, projectController.createProject);
router.get("/", Protected, projectController.getAllProjects);
router.patch(
  "/:id",
  Protected,
  uploadDocumentsControllers.uploadUserDocument,
  projectController.updateProject
);
router.get("/:id", projectController.getProject);

export default router;
