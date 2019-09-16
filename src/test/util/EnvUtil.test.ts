import { EnvUtil, EnvIsNotGivenError } from "../../util/EnvUtil";

const OLD_ENV = process.env;

describe("Test EnvUtil", () => {

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env["TESTING_ENV"] = "aaa";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe("Test getEnv", () => {
    test("Test getEnv", () => {
      expect(EnvUtil.getEnv("TESTING_ENV")).toBe(process.env["TESTING_ENV"]);
    });

    test("Test get the env which is not given", () => {
      try {
        EnvUtil.getEnv("NO_THIS_ENV");
      } catch (error) {
        expect(error).toBeInstanceOf(EnvIsNotGivenError);
      }
    });
  });
});