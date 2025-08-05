import { NextFunction, Request, Response } from 'express';

import AppError from '../utils/appError';
import { IUser } from '../interfaces/user.interface';
import User from '../models/user.model';
import catchAsync from '../utils/catchAsync';

// get all tours
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // BUILDING THE QUERY

    // 1a)FILTERING
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Remove null, undefined, and empty string values from queryObj
    Object.keys(queryObj).forEach(key => {
      if (
        queryObj[key] === null ||
        queryObj[key] === undefined ||
        queryObj[key] === ''
      ) {
        delete queryObj[key];
      }
    });

    // console.log(req.query) it is where the query parameters are stored

    // 1b)Advance filtering
    let queryStr = JSON.stringify(queryObj); //converting queryObj from object to string so that we can use replace method on it
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    let query = User.find(JSON.parse(queryStr)); // converting queryStr back to object and store it in query variable

    // 2) SORTING
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' '); //this logic was written because we can not use leave empty space in our query string though we can use commer but empty space was actuallywhat is needed
      query = query.sort(sortBy);
    } else {
      // query = query.sort("-createdAt");
    }

    // //2) FIELD LIMITING
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // 4) PAGINNATION(determining the document based on the page)
    const page = (req as any).query.page * 1 || 1; //converting our page value to number and if there is no page number the default should be 1
    const limit = (req as any).query.limit * 1 || 100; //converting our limit value to number and if there is no limit the default should be 100
    const skip = (page - 1) * limit;

    // page=2 limit=10, 1-10page1, 11-20page2, 21-30page3
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numUser = await User.countDocuments(); // this will count the number of documents available
      if (skip >= numUser) throw new Error('page does not exist');
    }
    // executing the query
    const users = await query;

    // sending response
    res.status(200).json({
      status: 'success',
      result: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};
const getUserStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await User.aggregate([
      {
        // $facet will enable us to run multiple pipelines at a time( the pipelines are totalUsers,unverifiedUsers)
        $facet: {
          //count the number of elements in Users model and store the value in count variable
          totalUsers: [{ $count: 'count' }],
          //count the number of elements in Users model whose isVarified field value is false and store the value in count variable
          unverifiedUsers: [
            { $match: { isVerified: false } },
            { $count: 'count' },
          ],
        },
      },
      {
        $project: {
          // $arrayElemAt allows us to the value of an array in a specified index
          totalUsers: { $arrayElemAt: ['$totalUsers.count', 0] },
          unverifiedUsers: { $arrayElemAt: ['$unverifiedUsers.count', 0] },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',

      message: stats,
      data: stats[0] || { totalUsers: 0, unverifiedUsers: 0 },
    });
  }
);

export default { getAllUsers, getUserStats };
