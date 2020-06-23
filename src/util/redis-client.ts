/*
 * File: RedisClient.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:20:50 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

import * as redis from 'redis';
import * as util from 'util';

export class RedisOptionMissedError extends Error {
  constructor() {
    super('redis connection option missed');
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, RedisOptionMissedError.prototype);
  }
}

export class RedisClient {
  private static instance: RedisClient | undefined;
  private static connectOption: redis.ClientOpts;
  private static isInit: boolean = false;

  private client: redis.RedisClient | undefined;

  /**
   * To get the instance of redis client. Before calling getInstance, it must call setConnectOption.
   *
   * @throws RedisOptionMissedError.
   */
  static getInstance() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    if (!RedisClient.isInit) {
      throw new RedisOptionMissedError();
    }

    RedisClient.instance = new RedisClient(RedisClient.connectOption);
    return RedisClient.instance;
  }

  /**
   * To set options of the connection. If the option is never set, the client will throw exception.
   *
   * @param {redis.ClientOpts} connectOption - Including host, port and all options you can defined in redis lib.
   */
  static setConnectOption(connectOption: redis.ClientOpts) {
    RedisClient.instance = undefined;
    RedisClient.connectOption = connectOption;
    RedisClient.isInit = true;
  }

  private constructor(options?: redis.ClientOpts) {
    RedisClient.connectOption = options ?? {};
    this.createClient();
  }

  /**
   * Only be called when the connection is lost.
   */
  private createClient(): redis.RedisClient {
    if (this.client) {
      return this.client;
    }
    this.client = redis.createClient(RedisClient.connectOption);
    return this.client;
  }

  /**
   * Get string by key.
   *
   * @param {string} key - Key.
   */
  async get(key: string): Promise<string> {
    if (!this.client!.connected) {
      this.createClient();
    }

    const getFunc = util.promisify(this.client!.get.bind(this.client));
    const data = await getFunc(key);
    return data;
  }

  /**
   * Set string by key.
   *
   * @param {string} key - Key.
   * @param {any} value - Value.
   * @param {string} mode - Mode.
   * @param {number} duration - Duration.
   */
  async set(key: string, value: any, mode: string = 'EX', duration: number = 86400): Promise<void> {
    if (!this.client?.connected) {
      this.createClient();
    }
    const setFunc: (...args: any[]) => {} = util.promisify(this.client!.set.bind(this.client));
    await setFunc(key, value, mode, duration);
  }

  /**
   * Delete by key.
   *
   * @param {string | string[]} keys - Deleted keys.
   */
  async del(keys: string | string[]): Promise<void> {
    if (!this.client!.connected) {
      this.createClient();
    }
    const delFunc: (...args: any[]) => {} = util.promisify(this.client!.del.bind(this.client));
    await delFunc(keys);
  }

  /**
   * Disconnect.
   */
  async quit(): Promise<void> {
    if (this.client?.connected) {
      const quitFunc = util.promisify(this.client!.quit.bind(this.client));
      await quitFunc();
      delete this.client;
      RedisClient.instance = undefined;
    }
  }

  /**
   * End without any waiting.
   *
   * @param {boolean} flush - Whether need to flush.
   */
  async end(flush?: boolean): Promise<void> {
    if (this.client?.connected) {
      const endFunc = util.promisify(this.client!.end.bind(this.client));
      await endFunc(flush);
      delete this.client;
      this.client = undefined;
    }
  }
}
