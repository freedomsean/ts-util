/*
 * File: RequestUtil.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:21:00 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

import Axios, { Method } from 'axios';

/**
 * HTTP ResponseData.
 */
export interface ResponseData {
  data: any;
  status: number;
  statusText: string;
  headers: any;
}

/**
 * HTTP RequestData.
 */
export interface RequestData {
  method: Method;
  url: string;
  headers?: any;
  data?: any;
}

/**
 * The HTTP Request Error.
 */
export class RequestError extends Error {
  constructor(requestData: RequestData, error: any) {
    super(`Request [${requestData.method}] Error, url: ${requestData.url}, reason: ${error}`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}

export class RequestUtil {
  /**
   * Do Http Request.
   *
   * @param {any} requestData - Request data.
   * @throws RequestError.
   */
  static async request(requestData: RequestData): Promise<ResponseData> {
    try {
      const result: ResponseData = await Axios(requestData.url, { ...requestData });
      if (Math.floor(result.status / 100) < 4) {
        return result;
      }

      throw new RequestError(requestData, `Request Status code is ${result.status}, data is ${result.data}`);
    } catch (error) {
      throw new RequestError(requestData, error);
    }
  }
}
