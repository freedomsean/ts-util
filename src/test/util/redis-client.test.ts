import { RedisClient, RedisOptionMissedError } from '../../util/redis-client';
import * as redis from 'redis';
import * as util from 'util';

const HOST: string = process.env['redis'] as string;
const describeExecutableTest = HOST ? describe : describe.skip;
const PORT: number = 6379;

let redisRawClient: redis.RedisClient;
let rawGetFunc: Function;
let rawSetFunc: Function;
let rawDelFunc: Function;
let rawQuitFunc: Function;

describeExecutableTest('Test RedisClient without setting connection option', () => {
  test('Test RedisClient without setting connection option', async () => {
    await expect(RedisClient.getInstance().quit()).rejects.toThrowError(RedisOptionMissedError);
  });
});

describeExecutableTest('Test RedisClient', () => {
  beforeEach(() => {
    RedisClient.setConnectOption({ host: HOST, port: PORT });
    redisRawClient = redis.createClient({
      host: HOST,
      port: PORT
    });
    rawQuitFunc = util.promisify(redisRawClient.quit.bind(redisRawClient));
    rawGetFunc = util.promisify(redisRawClient.get.bind(redisRawClient));
    rawSetFunc = util.promisify(redisRawClient.set.bind(redisRawClient));
    rawDelFunc = util.promisify(redisRawClient.del.bind(redisRawClient));
  });

  afterEach(async () => {
    await RedisClient.getInstance().quit();
    await rawQuitFunc();
  });

  describe('Test set method', () => {
    test('Test success set', async () => {
      const key = 'aaa';
      const val = 'bbb';

      await RedisClient.getInstance().set(key, val);
      const data = await rawGetFunc(key);
      expect(data).toBe(val);
      await rawDelFunc(key);
    });

    test('Test success set, but ttl is timeout, so there will be null', async () => {
      const key = 'ccc';
      const val = 'bbb';

      await expect(RedisClient.getInstance().set(key, val, 'XX', 1)).rejects.toThrowError(redis.ReplyError);
      const data = await rawGetFunc(key);
      expect(data).toBeNull();
    });
  });

  describe('Test get method', () => {
    test('Test success get', async () => {
      const key = 'aaa';
      const val = 'bbb';

      await rawSetFunc(key, val);
      const data = await RedisClient.getInstance().get(key);
      expect(data).toBe(val);
      await rawDelFunc(key);
    });

    test('Test get the key which does not have any value', async () => {
      const data = await RedisClient.getInstance().get('nothiskey');
      expect(data).toBeNull();
    });
  });

  describe('Test del method', () => {
    test('Test success del', async () => {
      const key = 'aaa';
      const val = 'bbb';
      await rawSetFunc(key, val);
      const data = await rawGetFunc(key);
      expect(data).toBe(val);

      await RedisClient.getInstance().del(key);
      const afterDel = await rawGetFunc(key);
      expect(afterDel).toBeNull();
    });

    test('Test del the key which does not have any value', async () => {
      await RedisClient.getInstance().del('nothiskey');
    });
  });
});
