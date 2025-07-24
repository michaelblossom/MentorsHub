import express from "express";
import groupController from "./../controllers/group.controller";
import Protected from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/", Protected, groupController.createGroup);
router.post("/add-to-group", Protected, groupController.addUserToGroup);

export default router;
