/*
 * File: EnvUtil.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:20:23 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

export class EnvIsNotGivenError extends Error {
  constructor(envName: string) {
    super(`ENV: ${envName} is not given`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, EnvIsNotGivenError.prototype);
  }
}

export class EnvUtil {
  static getEnv(envName: string): string {
    const data: string | undefined = process.env[envName];
    if (typeof data === 'undefined') {
      console.log(envName, 'is not given');
      throw new EnvIsNotGivenError(envName);
    }
    return data;
  }
}
