import express, { response } from 'express';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

import authRouter from './routes/auth.routes';
import groupRouter from './routes/group.route';
import projectRouter from './routes/project.route';

import cookieParser from 'cookie-parser';

import morgan from 'morgan';

const app = express();

// Global MIDDLEWARES'
// global middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// body parser
app.use(express.json({ limit: '10kb' }));

app.use(cookieParser());

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.static(`${__dirname}/public`)); //for serving static files

// Health check should be first
app.get('/', (_, res) => res.status(200).send('OK'));

// Then other routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/projects', projectRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
