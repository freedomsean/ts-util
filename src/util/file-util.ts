/*
 * File: FileUtil.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:20:36 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */
import * as fs from 'fs';
import * as Path from 'path';
import { Stream, Transform, Writable } from 'stream';
import * as util from 'util';

import {
  DecryptTransformStream,
  EncryptTransformStream,
  WriteDecryptMessageStream,
  WriteEncryptMessageStream
} from './encrypt-util';

export type WriteFileOptions =
  | {
      encoding?: string | null;
      mode?: number | string;
      flag?: string;
      autoMkdir?: boolean;
    }
  | string
  | null;

export type StreamWriteOptions =
  | {
      flags?: string;
      encoding?: string;
      fd?: number;
      mode?: number;
      autoClose?: boolean;
      start?: number;
    }
  | string;

export class FileIsAlreadyExistedError extends Error {
  constructor(path: string) {
    super(`File is already existed: ${path}`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, FileIsAlreadyExistedError.prototype);
  }
}

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, FileNotFoundError.prototype);
  }
}

export class IsDirectoryError extends Error {
  constructor(path: string) {
    super(`It is a file: ${path}`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, IsDirectoryError.prototype);
  }
}

export abstract class CopyStrategy {
  from: string;
  to: string;

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }
  async checkToPath(): Promise<void> {
    const fromStat = await FileUtil.lstat(this.from);
    const toIsExisted = await FileUtil.exists(this.to);
    const toStat = toIsExisted ? await FileUtil.lstat(this.to) : undefined;

    if (fromStat.isFile() && toStat && toStat.isDirectory()) {
      this.to = Path.join(this.to, Path.basename(this.from));
    }
  }

  async copy(): Promise<void> {
    await this.checkToPath();
    await this.doCopy();
  }

  abstract async doCopy(): Promise<void>;
  abstract clone(from: string, to: string): CopyStrategy;
}

export abstract class CopyWithKeyStrategy extends CopyStrategy {
  key: string;

  constructor(key: string, from: string, to: string) {
    super(from, to);
    this.key = key;
  }

  abstract async doCopy(): Promise<void>;
  abstract clone(from: string, to: string): CopyStrategy;
}

export class SimpleCopy extends CopyStrategy {
  constructor(from: string, to: string) {
    super(from, to);
  }

  async doCopy(): Promise<void> {
    await FileUtil.copyFile(this.from, this.to);
  }

  clone(from: string, to: string): CopyStrategy {
    return new SimpleCopy(from, to);
  }
}

export class CopyWithEncrypt extends CopyWithKeyStrategy {
  constructor(key: string, from: string, to: string) {
    super(key, from, to);
  }

  async doCopy(): Promise<void> {
    await FileUtil.copyFileWithEncryption(this.key, this.from, this.to);
  }

  clone(from: string, to: string): CopyStrategy {
    return new CopyWithEncrypt(this.key, from, to);
  }
}

export class CopyWithDecrypt extends CopyWithKeyStrategy {
  constructor(key: string, from: string, to: string) {
    super(key, from, to);
  }

  async doCopy(): Promise<void> {
    await FileUtil.copyFileWithDecryption(this.key, this.from, this.to);
  }

  clone(from: string, to: string): CopyStrategy {
    return new CopyWithDecrypt(this.key, from, to);
  }
}

export class FileUtil {
  /**
   * Write file, if options.autoMkdir is true, it will help generate directory.
   *
   * @param {string} path - Path string.
   * @param {string | Buffer} content - Content you want to write.
   * @param {fs.WriteFileOptions} options - Options.
   */
  static async writeFile(path: string, content: string | Buffer, options?: WriteFileOptions): Promise<void> {
    if (typeof options === 'object' && options?.autoMkdir) {
      const dirName = Path.dirname(path);
      await FileUtil.mkdir(dirName, { recursive: true });
    }
    const write = util.promisify(fs.writeFile.bind(fs));
    await write(path, content, options as fs.WriteFileOptions);
  }

  /**
   * Read File, if file does not exist, it will throw FileNotFoundError.
   *
   * @param {string} path - Path string.
   * @param {object} options - Encoding and flag.
   * @param {null} options.encoding - Encoding.
   * @param {string} options.flag - Flag.
   * @throws FileNotFoundError.
   */
  static async readFile(path: string, options?: { encoding?: null; flag?: string }): Promise<Buffer> {
    if (!FileUtil.exists(path)) {
      throw new FileNotFoundError(path);
    }

    const read = util.promisify(fs.readFile.bind(fs));
    const buffer: Buffer = await read(path, options);
    return buffer;
  }

  /**
   * Remove all files or directories recursively.
   *
   * @param {string} path - File path.
   */
  static async unlink(path: string): Promise<void> {
    if (!FileUtil.exists(path)) {
      return;
    }

    const stats = await FileUtil.lstat(path);
    if (stats.isDirectory()) {
      const files = await FileUtil.readdir(path);
      if (files.length === 0) {
        await FileUtil.rmdir(path);
      } else {
        const allUnlinkPromises = files.map((file) => {
          return FileUtil.unlink(Path.join(path, file));
        });
        await Promise.all(allUnlinkPromises);
        await FileUtil.unlink(path);
      }
    } else {
      const unlink = util.promisify(fs.unlink.bind(fs));
      await unlink(path);
    }
  }

  /**
   * Get the names of the files in the specific path.
   *
   * @param {string} path - File path.
   */
  static async readdir(path: string): Promise<string[]> {
    if (!FileUtil.exists(path)) {
      throw new FileNotFoundError(path);
    }

    const readdir = util.promisify(fs.readdir.bind(fs));
    const files: string[] = await readdir(path);
    return files;
  }

  /**
   * Get the file stat.
   *
   * @param {string} path - File path.
   */
  static async lstat(path: string): Promise<fs.Stats> {
    if (!FileUtil.exists(path)) {
      throw new FileNotFoundError(path);
    }

    const lstat = util.promisify(fs.lstat.bind(fs));
    const stats = await lstat(path);
    return stats;
  }

  /**
   * Synchronously check.
   *
   * @param {string} path - File path.
   */
  static exists(path: string): boolean {
    // Exists is deprecated
    return fs.existsSync(path);
  }

  /**
   * Get the dir name.
   *
   * @param {string} path - File path.
   */
  static getDirName(path: string): string {
    return Path.dirname(path);
  }

  /**
   * Get the base name.
   *
   * @param {string} path - File path.
   */
  static getBaseName(path: string): string {
    return Path.basename(path);
  }

  /**
   * Make directory.
   *
   * @param {string} path - File path.
   * @param {number | string | fs.MakeDirectoryOptions} options - Options.
   */
  static async mkdir(path: string, options?: number | string | fs.MakeDirectoryOptions): Promise<void> {
    const mkdir = util.promisify(fs.mkdir.bind(fs));
    await mkdir(path, options);
  }

  /**
   * Rename file or directory.
   *
   * @param {string} oldPath - Old file path.
   * @param {string} newPath - New file path.
   */
  static async rename(oldPath: string, newPath: string): Promise<void> {
    const oldIsExist = FileUtil.exists(oldPath);
    if (!oldIsExist) {
      throw new FileNotFoundError(oldPath);
    }

    const newIsExist = FileUtil.exists(newPath);
    if (newIsExist) {
      throw new FileIsAlreadyExistedError(newPath);
    }

    const rename = util.promisify(fs.rename.bind(fs));
    await rename(oldPath, newPath);
  }

  /**
   * Remove directory. To be private method, because the client can use unlink to do that.
   *
   * @param {string} path - File path.
   */
  private static async rmdir(path: string): Promise<void> {
    if (!FileUtil.exists(path)) {
      throw new FileNotFoundError(path);
    }

    const rmdir = util.promisify(fs.rmdir.bind(fs));
    await rmdir(path);
  }

  /**
   * Copy the file or the directory.
   *
   * @param {CopyStrategy} strategy - Strategy.
   * @param {object} options - Options.
   * @param {string[] | RegExp[]} options.excludes - Excludes.
   */
  static async copy(strategy: CopyStrategy, options: { excludes?: (string | RegExp)[] } = {}): Promise<void> {
    const { from, to } = strategy;
    const fromStat = await FileUtil.lstat(strategy.from);
    const toIsExisted = await FileUtil.exists(to);
    const excludes = Array.isArray(options.excludes) ? options.excludes : [];

    // To avoid the excludes at first round
    for (const exclude of excludes) {
      if (from.match(exclude)) {
        return;
      }
    }

    if (fromStat.isFile()) {
      return await strategy.copy();
    } else {
      if (!toIsExisted) {
        await FileUtil.mkdir(to, { recursive: true });
      }

      if (to[to.length - 1] === '/' || to[to.length - 1] === '/') {
        return await FileUtil.copy(strategy.clone(from, Path.join(to, Path.basename(from))), options);
      }
      const files = await FileUtil.readdir(from);

      // To reduce the useless action
      const promises = files
        .filter(
          (ele) => !excludes.reduce((accumulation, current) => accumulation || Boolean(ele.match(current)), false)
        )
        .map((ele) => FileUtil.copy(strategy.clone(Path.join(from, ele), Path.join(to, ele)), options));

      await Promise.all(promises);
    }
  }

  /**
   * Copy the file by stream.
   *
   * @param {string} from - From file path.
   * @param {string} to - To file path.
   */
  static async copyFile(from: string, to: string): Promise<void> {
    await FileUtil.unlink(to);
    return await FileUtil.copyFileByStream(from, [fs.createWriteStream(to)]);
  }

  /**
   * Copy file with encryption.
   *
   * @param {string} publicKeyPath - Public key file path.
   * @param {string} from - From file path.
   * @param {string} to - To file path.
   */
  static async copyFileWithEncryption(publicKeyPath: string, from: string, to: string): Promise<void> {
    const writable = new WriteEncryptMessageStream(to);
    const transform = new EncryptTransformStream(publicKeyPath);
    await Promise.all([transform.init(), FileUtil.unlink(to)]);
    await FileUtil.copyFileByStream(from, [transform, writable]);
  }

  /**
   * Copy file with decryption.
   *
   * @param {string} privateKeyPath - Private key file path.
   * @param {string} from - From file path.
   * @param {string} to - To file path.
   */
  static async copyFileWithDecryption(privateKeyPath: string, from: string, to: string): Promise<void> {
    const writable = new WriteDecryptMessageStream(to);
    const transform = new DecryptTransformStream(privateKeyPath);
    await Promise.all([transform.init(), FileUtil.unlink(to)]);
    await FileUtil.copyFileByStream(from, [transform, writable]);
  }

  /**
   * Copy file by the given streams, if the file is directory, it will throw error.
   *
   * @param {string} from - File path.
   * @param {Writable[] | Transform[]} outStreams - It can be writable or transform, but the latest stream must be writable.
   */
  static async copyFileByStream(from: string, outStreams: (Writable | Transform)[]): Promise<void> {
    const stats = await FileUtil.lstat(from);
    if (!stats.isFile()) {
      throw new IsDirectoryError(from);
    }

    let rs: Stream = fs.createReadStream(from, { highWaterMark: 128 });
    for (let i = 0; i < outStreams.length; i++) {
      // Assign rs again, in order to have the effect of chain
      rs = rs.pipe(outStreams[i]);
    }
    return new Promise((resolve, reject) => {
      outStreams[outStreams.length - 1].on('finish', resolve);
      outStreams[outStreams.length - 1].on('error', reject);
    });
  }
}
