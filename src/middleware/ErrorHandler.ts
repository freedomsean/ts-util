/*
 * File: ErrorHandler.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:21:06 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "./HttpResponse";

/**
 * The middleware to process the response, to make all response have the same structure
 * @param data
 * @param req
 * @param res
 * @param next
 */
export function ErrorHandler(data: any, req: Request, res: Response, next: NextFunction) {
  if (data instanceof HttpResponse) {
    res.status(data.statusCode).json(data.toJson());
  } else {
    res.json(data);
  }
}