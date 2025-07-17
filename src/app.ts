import express, { response } from "express";
import cors from "cors";
import { Request, Response, NextFunction } from "express";

import authRouter from "./routes/auth.routes";

// import cookieParser from "cookie-parser";

import morgan from "morgan";

const app = express();

// Global MIDDLEWARES'
// global middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// body parser
app.use(express.json({ limit: "10kb" }));

// app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.static(`${__dirname}/public`)); //for serving static files
app.use("/api/v1/auth", authRouter);

export default app;
