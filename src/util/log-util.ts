/*
 * File: LogUtil.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:20:43 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

import * as winston from 'winston';

/**
 * Log data to file.
 */
export class LogUtil {
  private _logger: winston.Logger;
  private static _INSTANCE: LogUtil;
  private static _CONFIG: winston.LoggerOptions;

  private constructor(config: winston.LoggerOptions) {
    const realConfig = {
      format: winston.format.json(),
      transports: [],
      ...config
    };
    this._logger = winston.createLogger<winston.DefaulLevels>(
      realConfig as winston.LoggerOptions<winston.DefaulLevels>
    );
  }

  static getInstance(): LogUtil {
    if (!LogUtil._INSTANCE) {
      LogUtil._INSTANCE = new LogUtil(LogUtil._CONFIG);
    }
    return LogUtil._INSTANCE;
  }

  static init(config: winston.LoggerOptions): void {
    LogUtil._CONFIG = config;
  }

  info(data: string, ...meta: any[]) {
    this.log('info', data, ...meta);
  }

  debug(data: string, ...meta: any[]) {
    this.log('debug', data, ...meta);
  }

  error(data: string, ...meta: any[]) {
    this.log('error', data, ...meta);
  }

  log(level: string, data: string, ...meta: any[]) {
    this._logger.log(level, data, ...meta);
  }
}
