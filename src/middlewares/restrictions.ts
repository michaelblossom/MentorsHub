import { Request, Response, NextFunction } from "express";
import AuthenticationError from "./../errors/authenticationErrors";

// restrictions
export const restrict = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user.role)) {
      const error = new AuthenticationError(
        "You do not have permission to perform this action"
      );
      return next(error);
    }
    next();
  };
};
