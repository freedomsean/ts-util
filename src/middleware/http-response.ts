/*
 * File: HttpResponse.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:21:11 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

/**
 * Http Response Code.
 */
export type ResponseCode = {
  /**
   * Http status code.
   */
  statusCode?: any;

  /**
   * If user had set that, it will have the different code in the body.
   */
  bodyCode?: number;
};

/**
 * Abstract Http Response.
 */
export abstract class HttpResponse {
  /**
   * Http status code.
   */
  statusCode: number;

  /**
   * If user had set that, it will have the different code in the body.
   */
  bodyCode: number;

  constructor(defaultCode: number, code?: ResponseCode) {
    this.processCode(defaultCode, code);
  }

  private processCode(defaultCode: number, code?: ResponseCode) {
    const statusCode = code && typeof code.statusCode === 'number' ? code.statusCode : defaultCode;
    const bodyCode = code && typeof code.bodyCode === 'number' ? code.bodyCode : statusCode;
    this.statusCode = statusCode;
    this.bodyCode = bodyCode;
  }

  abstract toJson(): any;
  abstract getData(): any;

  protected successResponse(): any {
    return {
      code: this.bodyCode,
      data: this.getData()
    };
  }

  protected errorResponse(): any {
    return {
      code: this.bodyCode,
      error: this.getData()
    };
  }
}

/**
 * Success Response, 2XX.
 */
export class HttpSuccessResponse extends HttpResponse {
  data: any;

  constructor(data: any, code?: ResponseCode) {
    super(200, code);
    const realData = data;
    this.data = realData;
  }

  getData(): any {
    return this.data;
  }

  toJson(): any {
    return this.successResponse();
  }
}

/**
 * Not Modify Response, 304, no any content.
 */
export class HttpNotModifyResponse extends HttpResponse {
  constructor() {
    super(304);
  }
  toJson(): any {
    return this.successResponse();
  }
  getData(): any {
    return null;
  }
}

export class HttpBadRequestErrorResponse extends HttpResponse {
  errors: { location?: string; msg: string; param: string }[];

  constructor(errors: { location?: string; msg: string; param: string }[], code?: ResponseCode) {
    super(400, code);
    this.errors = errors;
  }

  toJson() {
    return this.errorResponse();
  }

  getData() {
    return { validateErrors: this.errors };
  }
}

/**
 * System Error Response, 5XX.
 */
export class HttpSystemErrorResponse extends HttpResponse {
  error: any;

  constructor(data: any, code?: ResponseCode) {
    super(500, code);
    const realData = data;
    this.error = realData;
  }

  getData(): any {
    return this.error;
  }

  toJson(): any {
    return this.errorResponse();
  }
}
