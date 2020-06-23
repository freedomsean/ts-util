/*
 * File: EncryptUtil.ts
 * Project: ts-util
 * File Created: Sunday, 1st September 2019 2:03:50 pm
 * Author: freedomsean (t101598009@ntut.org)
 * -----
 * Last Modified: Sunday, 1st September 2019 4:20:13 pm
 * Modified By: freedomsean (t101598009@ntut.org>)
 * -----
 * This file can be used in the commercial or personal purpose.
 * If you want to use this, please send a message for me and keep the information in the header.
 */

import { FileUtil } from './file-util';
import * as path from 'path';
import * as crypto from 'crypto';
import { Transform, TransformOptions, TransformCallback, Writable, WritableOptions } from 'stream';
import { createReadStream } from 'fs';

/**
 * Transform data to encrypted data.
 */
export class EncryptTransformStream extends Transform {
  publicKeyPath: string;
  publicKey: any;

  constructor(publicKeyPath: string, options?: TransformOptions) {
    super(options);
    this.publicKeyPath = path.resolve(publicKeyPath);
  }

  async init(): Promise<void> {
    this.publicKey = await FileUtil.readFile(this.publicKeyPath);
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    const data = EncryptUtil.encryptAsBuffer(this.publicKey, chunk);
    this.push(data);
    callback();
  }
}

/**
 * Transform encrypted buffer to decryption.
 */
export class DecryptTransformStream extends Transform {
  privateKeyPath: string;
  privateKey: any;
  partInfo: string = '';

  constructor(privateKeyPath: string, options?: TransformOptions) {
    super(options);
    this.privateKeyPath = path.resolve(privateKeyPath);
  }

  async init(): Promise<void> {
    this.privateKey = await FileUtil.readFile(this.privateKeyPath);
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    const data: string = encoding === 'buffer' ? chunk.toString() : chunk;
    const split: string[] = data.split('\n');

    if (split.length > 0) {
      split[0] = this.partInfo + split[0];
      if (data[data.length - 1] !== '\n') {
        this.partInfo = split.splice(split.length - 1)[0];
      } else {
        this.partInfo = '';
      }

      for (const s of split) {
        if (s.length > 0) {
          const d = EncryptUtil.decryptAsBuffer(this.privateKey, s);
          this.push(d);
        }
      }
    }

    callback();
  }
}

export class WriteEncryptIntoSingleMessageStream extends Writable {
  outPath: string;
  gb: bigint = BigInt(0);
  mb: bigint = BigInt(0);
  kb: bigint = BigInt(0);
  b: bigint = BigInt(0);

  constructor(inPath: string, outPath: string, keyPath: string, options?: WritableOptions) {
    super(options);
    this.outPath = outPath;
    this.on('finish', async () => {
      const content: string = await EncryptUtil.encryptString(
        keyPath,
        `${inPath}: ${this.b},${this.kb},${this.mb},${this.gb}\n`
      );
      await FileUtil.writeFile(`./${outPath}.index`, content, { flag: 'a' });
    });
  }

  processLength(size: bigint) {
    this.b = this.b + size;
    if (this.b >= 1024) {
      this.kb += (this.b / BigInt(1024)) >> BigInt(0);
      this.b = this.b % BigInt(1024);
    }

    if (this.kb >= 1024) {
      this.mb += (this.kb / BigInt(1024)) >> BigInt(0);
      this.kb = this.kb % BigInt(1024);
    }

    if (this.mb >= 1024) {
      this.gb += (this.mb / BigInt(1024)) >> BigInt(0);
      this.mb = this.mb % BigInt(1024);
    }
  }

  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    const data: string = encoding === 'buffer' ? chunk.toString('base64') : chunk;
    this.b += BigInt(data.length + 1);
    FileUtil.writeFile(this.outPath, data + '\n', { flag: 'a' })
      .then(() => callback())
      .catch((e) => callback(e));
  }
}

/**
 * The stream to write encrypted message.
 */
export class WriteEncryptMessageStream extends Writable {
  outPath: string;
  len: bigint = BigInt(0);

  constructor(outPath: string, options?: WritableOptions) {
    super(options);
    this.outPath = outPath;
  }

  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    const data: any = encoding === 'buffer' ? chunk.toString('base64') : chunk;
    FileUtil.writeFile(this.outPath, data + '\n', { flag: 'a' })
      .then(() => callback())
      .catch((e) => callback(e));
  }
}

/**
 * The stream to write decrypted message. In actually, it does not have any difference with createWriteStream.
 */
export class WriteDecryptMessageStream extends Writable {
  outPath: string;
  all: any;

  constructor(outPath: string, options?: WritableOptions) {
    super(options);
    this.outPath = outPath;
  }

  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    FileUtil.writeFile(this.outPath, chunk, { flag: 'a' })
      .then(() => callback())
      .catch((e) => callback(e));
  }
}

export class EncryptUtil {
  /**
   * Encrypt as buffer, to offer stream use.
   *
   * @param {Buffer} publicKey - Public key content.
   * @param {string | Buffer} toEncrypt - Content which needs to be encrypt.
   */
  static encryptAsBuffer(publicKey: Buffer, toEncrypt: string | Buffer): Buffer {
    const buffer = Buffer.isBuffer(toEncrypt) ? toEncrypt : Buffer.from(toEncrypt);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted;
  }

  /**
   * Encrypt by public key.
   *
   * @param {string} publicKeyPath - Public key path.
   * @param {string | Buffer} toEncrypt - Content which needs to be encrypt.
   */
  static async encryptString(publicKeyPath: string, toEncrypt: string | Buffer): Promise<string> {
    const absolutePath = path.resolve(publicKeyPath);
    const publicKey = await FileUtil.readFile(absolutePath);
    const encrypted = EncryptUtil.encryptAsBuffer(publicKey, toEncrypt);
    return encrypted.toString('base64');
  }

  /**
   * Encrypt file by public key using public key.
   *
   * @param {string} publicKeyPath - Public key path.
   * @param {string} rawDataPath - Input file path.
   * @param {string} outputFilePath - Output file path.
   */
  static async encryptFile(publicKeyPath: string, rawDataPath: string, outputFilePath: string): Promise<void> {
    // If your key is 1024 bits, you need to make sure the input is 128 bytes
    // https://github.com/nodejs/node/issues/9588#issuecomment-260486961
    const readable = createReadStream(rawDataPath, { highWaterMark: 128 });
    const writable = new WriteEncryptMessageStream(outputFilePath);
    const transform = new EncryptTransformStream(publicKeyPath);
    await await Promise.all([transform.init(), FileUtil.unlink(outputFilePath)]);
    readable.pipe(transform).pipe(writable);

    return new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
    });
  }

  /**
   * Decrypt as buffer, to offer stream use.
   *
   * @param {Buffer} privateKey - Private key content.
   * @param {string | Buffer} toDecrypt - Content which needs to be decrypt.
   */
  static decryptAsBuffer(privateKey: Buffer, toDecrypt: string | Buffer): Buffer {
    const buffer = Buffer.isBuffer(toDecrypt) ? toDecrypt : Buffer.from(toDecrypt, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted;
  }

  /**
   * Use private key to decrypt the data encrypted by public key.
   *
   * @param {string} privateKeyPath - Private key path.
   * @param {string | Buffer} toDecrypt - Content which needs to be decrypt.
   */
  static async decryptString(privateKeyPath: string, toDecrypt: string | Buffer): Promise<string> {
    const absolutePath = path.resolve(privateKeyPath);
    const privateKey = await FileUtil.readFile(absolutePath);
    const decrypted = EncryptUtil.decryptAsBuffer(privateKey, toDecrypt);
    return decrypted.toString();
  }

  /**
   * Decrypt file by private key using stream.
   *
   * @param {string} privateKeyPath - Private key path.
   * @param {string} encryptedFilePath - Input file path.
   * @param {string} outputFilePath - Output file path.
   */
  static async decryptFile(privateKeyPath: string, encryptedFilePath: string, outputFilePath: string): Promise<void> {
    const readable = createReadStream(encryptedFilePath);
    const writable = new WriteDecryptMessageStream(outputFilePath);
    const transform = new DecryptTransformStream(privateKeyPath);
    await await Promise.all([transform.init(), FileUtil.unlink(outputFilePath)]);
    readable.pipe(transform).pipe(writable);

    return new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
    });
  }
}
