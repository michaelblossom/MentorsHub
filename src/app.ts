import express, { response } from "express";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import AppError from "./utils/appError";
import { Error } from "./types/index";

import authRouter from "./routes/auth.routes";
import groupRouter from "./routes/group.route";
import projectRouter from "./routes/project.route";
import reviewRouter from "./routes/review.route";

import cookieParser from "cookie-parser";

import morgan from "morgan";
const rateLimit = require("express-rate-limit"); //npm package that prevents multiple request from one Ip-address

const app = express();

// Global MIDDLEWARES'
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ratelimiter for regulating request from same ip
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this Ip, please try again in an hour time",
});

// making the limitter to work in all api starting with  /api (Limiter is a middle so we can apply app.use on it)
app.use("/api", limiter);

// body parser
app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());

app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
  })
);

app.use(express.static(`${__dirname}/public`)); //for serving static files

// Health check should be first
app.get("/", (_, res) => res.status(200).send("Welcome to MentorsHub API"));

// Then other routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/projects", projectRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
  // console.error(err.stack);
  // res.status(500).send("Something broke!");
});

// Handling undefined routes
// app.all("*", (req: Request, res: Response, next: NextFunction) => {
//   return next(
//     new AppError(`Can't find ${req.originalUrl} on this saver!`, 404)
//   );
// });

// Global Error Handling
// app.use(err:Error,req:Request,res:Response,next:NextFunction) => {
//   err.statusCode = err.statusCode || 500
//   err.status = err.status || 'error'

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
// }

export default app;
