import express from "express";
import projectController from "./../controllers/project.controller";
import Protected from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/", Protected, projectController.createProject);

export default router;
