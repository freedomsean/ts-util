import { RequestUtil, RequestError } from "../../util/RequestUtil";

describe("Test RequestUtil", () => {
  describe("Test request method", () => {
    test("Test success request", async () => {
      try {
        const result = await RequestUtil.request({ method: "GET", url: "http://example.com" });
        expect(result.status).toBe(200);
      } catch (error) {
        expect(error.toString()).toThrow(error);
      }
    });

    test("Test 404 request", async () => {
      const errorUrl: string = "http://www.cddd.tw/~u91029/DynamicProgramming.html";
      const method: "GET" = "GET";

      try {
        await RequestUtil.request({ method, url: errorUrl });
        expect({}).toThrow("must be error");
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError);
        expect(error.requestData.url).toBe(errorUrl);
        expect(error.requestData.method).toBe(method);
      }
    });
  });
});