import { Request } from "express";
import multer, { Multer, FileFilterCallback } from "multer";
const AppError = require("./../utils/appError");
// import AppError from "../utils/appError";

// const multerStorage = multer.memoryStorage();
// using diskStorage
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/public/documents");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `User-${(req as any).user.id}-${Date.now()}.${ext}`);
  },
});

// File filter to allow only PDF and Word documents
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only PDF and Word documents are allowed", 400), false);
  }
};

// Configure multer
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const uploadUserDocument = upload.single("file");

export default {
  uploadUserDocument,
};
