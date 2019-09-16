import { ErrorHandler } from "../../middleware/ErrorHandler";
import { HttpSuccessResponse, HttpSystemErrorResponse, HttpNotModifyResponse } from "../../middleware/HttpResponse";
import * as express from "express";
import { Express, Request, Response, NextFunction } from "express";
import supertest = require("supertest");

let successTemplate: any = {
  code: 200,
  data: {}
};

let errorTemplate: any = {
  code: 500,
  error: {}
};

const API_SUCCESS_WITHOUT_CODE = "/success_without_code";
const API_SUCCESS_WITH_STATUS_CODE = "/success_with_code";
const API_SUCCESS_WITH_BODY_CODE = "/success_with_body_code";
const API_NOT_MODIFIED = "/NOT_MODIFIED";
const API_SYSTEM_ERROR = "/system_error";


describe("ErrorHandler", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.get(API_SUCCESS_WITHOUT_CODE, (req: express.Request, res: Response, next: NextFunction) => {
      next(new HttpSuccessResponse({ abc: 123 }));
    });

    app.get(API_SUCCESS_WITH_STATUS_CODE, (req: express.Request, res: Response, next: NextFunction) => {
      next(new HttpSuccessResponse({ abc: 456 }, { statusCode: 203 }));
    });

    app.get(API_SUCCESS_WITH_BODY_CODE, (req: express.Request, res: Response, next: NextFunction) => {
      next(new HttpSuccessResponse({ abc: 456 }, { bodyCode: 999 }));
    });

    app.get(API_NOT_MODIFIED, (req: express.Request, res: Response, next: NextFunction) => {
      next(new HttpNotModifyResponse());
    });

    app.get(API_SYSTEM_ERROR, (req: express.Request, res: Response, next: NextFunction) => {
      next(new HttpSystemErrorResponse({ lll: 123 }));
    });

    app.use(ErrorHandler);
  });

  afterAll(() => {
    app = undefined;
  });

  let requestTest = (url: string, statusCode: number, expectedData: any, done: jest.DoneCallback) => {
    supertest(app)
      .get(url)
      .expect("Content-Type", /json/)
      .expect(statusCode)
      .end((err, res: supertest.Response) => {
        if (err) {
          expect(err.toString()).toThrowError(err);
        }
        expect(res.text).toBe(JSON.stringify(expectedData));
        done();
      });
  };

  describe("Test success response", () => {
    test("Test success response with default code", (done: jest.DoneCallback) => {
      successTemplate.data = { "abc": 123 };
      requestTest(API_SUCCESS_WITHOUT_CODE, successTemplate.code, successTemplate, done);
    });

    test("Test success response with custom status code", (done: jest.DoneCallback) => {
      successTemplate.code = 203;
      successTemplate.data = { "abc": 456 };
      requestTest(API_SUCCESS_WITH_STATUS_CODE, successTemplate.code, successTemplate, done);
    });

    test("Test success response with custom body code", (done: jest.DoneCallback) => {
      successTemplate.code = 999;
      successTemplate.data = { "abc": 456 };
      // diff code between body and http status
      requestTest(API_SUCCESS_WITH_BODY_CODE, 200, successTemplate, done);
    });
  });


  describe("Test not modified response", () => {
    test("Test not modified response", (done: jest.DoneCallback) => {
      // 304 won't have any response data, so it also does not have any content type
      supertest(app)
        .get(API_NOT_MODIFIED)
        .expect(304)
        .end((err, res: supertest.Response) => {
          if (err) {
            expect(err.toString()).toThrowError(err);
          }
          done();
        });
    });
  });

  describe("Test system error response", () => {
    test("Test  system error response", (done: jest.DoneCallback) => {
      errorTemplate.error = { "lll": 123 };
      requestTest(API_SYSTEM_ERROR, errorTemplate.code, errorTemplate, done);
    });
  });
});