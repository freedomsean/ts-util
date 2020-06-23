import { RequestUtil, RequestError } from '../../util/request-util';

describe.skip('Test RequestUtil', () => {
  describe('Test request method', () => {
    test('Test success request', async () => {
      const result = await RequestUtil.request({ method: 'GET', url: 'https://example.com' });
      expect(result.status).toBe(200);
    });

    test('Test 404 request', async () => {
      const errorUrl: string = 'http://www.cddd.tw/~u91029/DynamicProgramming.html';
      const method: 'GET' = 'GET';
      await expect(RequestUtil.request({ method, url: errorUrl })).rejects.toThrowError(RequestError);
    });
  });
});
