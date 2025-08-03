import { Response, Request, NextFunction } from 'express';
// import { promisify } from "util";
const { promisify } = require('util'); //builtin function for promifying token verification
import * as JWT from 'jsonwebtoken';
import User from '../models/user.model';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { verify } from 'crypto';

// PROTECT MIDDLEWARE
const Protected = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1)Getting token and check if it exist
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.JWT) {
      token = (req as any).cookie.JWT;
    }
    if (!token) {
      return next(
        new AppError('you are not loggedin, please login to get access', 401)
      );
    }
    // 2)verify the token
    // the decoded variable will return the payload({id, time token created , time token expires})
    const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);
    // 3)check if the user accessing the route still exist
    const currentUser = await User.findById(decoded.id); //we are using findById because we use our id as our payload in generating the token that is stored in our decoded

    if (!currentUser) {
      return next(new AppError(' User does not exist', 401));
    }
    // //   // 4)check if user change password after token was issued
    // //   // calling passwordchangedAfter function from userModel
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(
    //     new AppError("User recently changed password please login again", 401)
    //   );
    // }
    // GRANT ACCESS TO PROTECTED ROUTE
    (req as any).user = currentUser;
    next();
  }
);
export default Protected;
