import { DecryptTransformStream, WriteDecryptMessageStream } from '../../util/encrypt-util';
import { FileUtil } from '../../util/file-util';
import { EncryptUtil, WriteEncryptMessageStream, EncryptTransformStream } from '../../util/encrypt-util';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { createReadStream, createWriteStream } from 'fs';

// Use ssh-keygen -f ~/.ssh/id_rsa.pub -m "PEM" -e > public.pem
const publicKeyPath = './ssh-key/public.pem';
const privateKeyPath = './ssh-key/id_rsa';

describe('Test Stream of Encryption', () => {
  const testContent = 'I am test';
  const testTextFilePath = './testdata/testfile.txt';
  const testZipFilePath = './testdata/testfile.zip';
  const encryptFinalResultPath = './testdata/result.encrypt';
  const decryptFinalResultPath = './testdata/result.decrypt';
  describe('Test Encrypt and Decrypt', () => {
    beforeEach((done: jest.DoneCallback) => {
      FileUtil.writeFile(testTextFilePath, testContent, { autoMkdir: true })
        .then(() => {
          const zipStream = zlib.createGzip();
          const reader = createReadStream(testTextFilePath);
          const writer = createWriteStream(testZipFilePath);
          reader.pipe(zipStream).pipe(writer);
          writer.on('finish', () => done());
          writer.on('error', () => done('write error'));
        })
        .catch(done);
    });

    afterEach(async (done: jest.DoneCallback) => {
      try {
        await FileUtil.unlink(testTextFilePath);
        await FileUtil.unlink(testZipFilePath);
        await FileUtil.unlink(encryptFinalResultPath);
        await FileUtil.unlink(decryptFinalResultPath);
        done();
      } catch (error) {
        done(error);
      }
    });

    const doEncryptAndDecrypt = async (rawDataPath: string, done: jest.DoneCallback) => {
      try {
        // If your key is 1024 bits, you need to make sure the input is 128 bytes
        // https://github.com/nodejs/node/issues/9588#issuecomment-260486961
        const readable = createReadStream(rawDataPath, { highWaterMark: 128 });
        const writable = new WriteEncryptMessageStream(encryptFinalResultPath);
        const transform = new EncryptTransformStream(publicKeyPath);
        await transform.init();
        readable.pipe(transform).pipe(writable);

        writable.on('finish', async () => {
          try {
            const readableDecryption = createReadStream(encryptFinalResultPath);
            const writableDecryption = new WriteDecryptMessageStream(decryptFinalResultPath);
            const transformDecryption = new DecryptTransformStream(privateKeyPath);
            await transformDecryption.init();
            readableDecryption.pipe(transformDecryption).pipe(writableDecryption);

            writableDecryption.on('finish', async () => {
              const testFile = await FileUtil.readFile(rawDataPath);
              const result = await FileUtil.readFile(decryptFinalResultPath);
              const testStr = testFile.toString('base64');
              const resultStr = result.toString('base64');
              expect(testStr).toBe(resultStr);
              done();
            });
            writableDecryption.on('error', () => done('encrypt error'));
          } catch (error) {
            done(error);
          }
        });

        writable.on('error', () => done('encrypt error'));
      } catch (error) {
        done(error);
      }
    };

    test('Test encrypt a text file', async (done: jest.DoneCallback) => {
      await doEncryptAndDecrypt(testTextFilePath, done);
    });

    test('Test encrypt a zip file', async (done: jest.DoneCallback) => {
      await doEncryptAndDecrypt(testZipFilePath, done);
    });
  });
});

describe('Test EncryptUtil', () => {
  describe('Test encryptString', () => {
    const decrypt = async (encrypted: string): Promise<string> => {
      const absolutePath = path.resolve(privateKeyPath);
      const privateKey = await FileUtil.readFile(absolutePath);
      const buffer = Buffer.from(encrypted, 'base64');
      const decrypted = crypto.privateDecrypt(privateKey, buffer);
      return decrypted.toString('utf-8');
    };

    test('Test encryptString with string', async () => {
      const content = 'I am bbb';
      const str: string = await EncryptUtil.encryptString(publicKeyPath, content);
      const decrypted: string = await decrypt(str);
      expect(decrypted).toBe(content);
    });

    test('Test encryptString with buffer', async () => {
      const content = 'I am bbb';
      const str: string = await EncryptUtil.encryptString(publicKeyPath, Buffer.from(content));
      const decrypted: string = await decrypt(str);
      expect(decrypted).toBe(content);
    });
  });

  describe('Test decryptStringWithRsaPrivateKey', () => {
    const encrypt = async (content: string): Promise<Buffer> => {
      const absolutePath = path.resolve(publicKeyPath);
      const publicKey = await FileUtil.readFile(absolutePath);
      const buffer = Buffer.from(content);
      const encrypted = crypto.publicEncrypt(publicKey, buffer);
      return encrypted;
    };

    test('Test decryptString with buffer', async () => {
      const content = 'I am bbb';
      const encrypted = await encrypt(content);
      const decrypted: string = await EncryptUtil.decryptString(privateKeyPath, encrypted);
      expect(decrypted).toBe(content);
    });

    test('Test decryptString with string', async () => {
      const content = 'I am bbb';
      const encrypted = await encrypt(content);
      const decrypted: string = await EncryptUtil.decryptString(privateKeyPath, encrypted.toString('base64'));
      expect(decrypted).toBe(content);
    });
  });

  describe('Test Encrypt and Decrypt using Stream by Library', () => {
    const testContent = 'I am test';
    const testTextFilePath = './testdata/testfile.txt';
    const testZipFilePath = './testdata/testfile.zip';
    const encryptFinalResultPath = './testdata/result.encrypt';
    const decryptFinalResultPath = './testdata/result.decrypt';

    beforeEach((done: jest.DoneCallback) => {
      FileUtil.writeFile(testTextFilePath, testContent, { autoMkdir: true })
        .then(() => {
          const zipStream = zlib.createGzip();
          const reader = createReadStream(testTextFilePath);
          const writer = createWriteStream(testZipFilePath);
          reader.pipe(zipStream).pipe(writer);
          writer.on('finish', () => done());
          writer.on('error', () => done('write error'));
        })
        .catch(done);
    });

    afterEach(async () => {
      await FileUtil.unlink(testTextFilePath);
      await FileUtil.unlink(testZipFilePath);
      await FileUtil.unlink(encryptFinalResultPath);
      await FileUtil.unlink(decryptFinalResultPath);
    });

    const doEncryptAndDecrypt = async (inputFilePath: string): Promise<void> => {
      await EncryptUtil.encryptFile(publicKeyPath, inputFilePath, encryptFinalResultPath);
      await EncryptUtil.decryptFile(privateKeyPath, encryptFinalResultPath, decryptFinalResultPath);
      const testFile = await FileUtil.readFile(inputFilePath);
      const result = await FileUtil.readFile(decryptFinalResultPath);
      const testStr = testFile.toString('base64');
      const resultStr = result.toString('base64');
      expect(testStr).toBe(resultStr);
    };

    test('Test encrypt a text file', async () => {
      await doEncryptAndDecrypt(testTextFilePath);
    });

    test('Test encrypt a zip file', async () => {
      await doEncryptAndDecrypt(testZipFilePath);
    });
  });
});
