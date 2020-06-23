import { EncryptUtil } from '../../util/encrypt-util';
import {
  FileUtil,
  FileNotFoundError,
  FileIsAlreadyExistedError,
  IsDirectoryError,
  SimpleCopy,
  CopyStrategy,
  CopyWithEncrypt,
  CopyWithDecrypt
} from '../../util/file-util';
import * as fs from 'fs';

describe('Test FileUtil', () => {
  describe('Test writeFile', () => {
    test('Test success to writeFile', async () => {
      const content = 'I am bbb';
      const normalPath = './testdata/bbb.txt';

      await FileUtil.writeFile(normalPath, content);
      expect(fs.readFileSync(normalPath).toString()).toBe(content);
      fs.unlinkSync(normalPath);
    });

    test('Test success to writeFile with autoMkdir', async () => {
      const content = 'I am eee';
      const longPath = './testdata/aaa/bbb/ccc/ddd/eee.txt';

      await FileUtil.writeFile(longPath, content, { autoMkdir: true });
      expect(fs.readFileSync(longPath).toString()).toBe(content);
      fs.unlinkSync(longPath);
      fs.rmdirSync('./testdata/aaa/bbb/ccc/ddd');
      fs.rmdirSync('./testdata/aaa/bbb/ccc');
      fs.rmdirSync('./testdata/aaa/bbb');
      fs.rmdirSync('./testdata/aaa');
    });
  });

  describe('Test unlink', () => {
    const content = 'I am bbb';

    test('Test success to unlink', async () => {
      const path = './testdata/bbb.txt';

      fs.writeFileSync(path, content);
      await FileUtil.unlink(path);
      const isExist = fs.existsSync(path);
      expect(isExist).toBe(false);
    });

    test('Test success to to unlink recursively', async () => {
      const longPath = './testdata/aaa/bbb/ccc/ddd/eee.txt';
      const mainDir = './testdata/aaa';

      fs.mkdirSync('./testdata/aaa/bbb/ccc/ddd', { recursive: true });
      fs.writeFileSync(longPath, content);
      await FileUtil.unlink(mainDir);
      const isExist = fs.existsSync(longPath);
      expect(isExist).toBe(false);
    });

    test('Test unlink the file which does not exist', async () => {
      const path = './testdata/aaa/bbb/zzz/ddd/eee.txt';

      const isExist = fs.existsSync(path);
      expect(isExist).toBe(false);
    });
  });

  describe('Test readFile', () => {
    test('Test success to readFile', async () => {
      const path = './testdata/bbb.txt';
      const content = 'I am bbb';

      fs.writeFileSync(path, content);
      const realContent = await FileUtil.readFile(path);
      expect(realContent.toString()).toBe(content);
      fs.unlinkSync(path);
    });

    test('Test read the file which does not exist', async () => {
      const path = './testdata/aaa/bbb/ccc/ddd/eee.txt';

      await expect(FileUtil.readFile(path)).rejects.toThrowError(FileNotFoundError);
    });
  });

  describe('Test readDir', () => {
    const path = './testdata';

    test('Test success to read dir which have dir and files', async () => {
      fs.mkdirSync(path + '/aaa');
      fs.mkdirSync(path + '/bbb/ccc/ddd', { recursive: true });
      fs.writeFileSync(path + '/ddd.txt', 'aaabbbccc');
      fs.writeFileSync(path + '/aaa/fff.txt', 'fff');
      fs.writeFileSync(path + '/aaa/daa.txt', 'daa');
      const files = await FileUtil.readdir(path);
      expect(files.length).toBe(3);
      fs.unlinkSync(path + '/aaa/daa.txt');
      fs.unlinkSync(path + '/aaa/fff.txt');
      fs.rmdirSync(path + '/aaa');
      fs.unlinkSync(path + '/ddd.txt');

      fs.rmdirSync(path + '/bbb/ccc/ddd');
      fs.rmdirSync(path + '/bbb/ccc');
      fs.rmdirSync(path + '/bbb');
    });

    test('Test read the dir which does not exist', async () => {
      const path = './testdata/aaa/bbb/ccc/ddd';

      await expect(FileUtil.readdir(path)).rejects.toThrowError(FileNotFoundError);
    });
  });

  describe('Test lstat', () => {
    test('Test success to lstat file', async () => {
      const path = './testdata/bbb.txt';
      const content = 'I am bbb';

      fs.writeFileSync(path, content);
      const stats = await FileUtil.lstat(path);
      expect(stats.isFile()).toBe(true);
      fs.unlinkSync(path);
    });

    test('Test success to lstat dir', async () => {
      const mainTestDir = './testdata';

      const stats = await FileUtil.lstat(mainTestDir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('Test lstat the dir which does not exist', async () => {
      const path = './testdata/aaa/bbb/zzz/ddd';

      await expect(FileUtil.lstat(path)).rejects.toThrowError(FileNotFoundError);
    });
  });

  describe('Test getDirName', () => {
    test('Test getDirName', () => {
      expect(FileUtil.getDirName('./testdata')).toBe('.');
      expect(FileUtil.getDirName('./testdata/aaa')).toBe('./testdata');
    });
  });

  describe('Test getBaseName', () => {
    test('Test getBaseName', () => {
      expect(FileUtil.getBaseName('./testdata')).toBe('testdata');
      expect(FileUtil.getBaseName('./testdata/aaa.txt')).toBe('aaa.txt');
    });
  });

  describe('Test rename', () => {
    const mainPath = './testdata';

    test('Test rename the directory which has a file', async () => {
      fs.mkdirSync(mainPath + '/aaa');
      fs.writeFileSync(mainPath + '/aaa/ccc.txt', 'ccc');
      await FileUtil.rename(mainPath + '/aaa', mainPath + '/bbb');
      const data = fs.readFileSync(mainPath + '/bbb/ccc.txt');
      expect(data.toString()).toBe('ccc');
      fs.unlinkSync(mainPath + '/bbb/ccc.txt');
      fs.rmdirSync(mainPath + '/bbb');
    });

    test('Test rename the directory, but the new path is already existed', async () => {
      fs.mkdirSync(mainPath + '/aaa');
      fs.mkdirSync(mainPath + '/bbb');
      await expect(FileUtil.rename(mainPath + '/aaa', mainPath + '/bbb')).rejects.toThrowError(
        FileIsAlreadyExistedError
      );
      fs.rmdirSync(mainPath + '/aaa');
      fs.rmdirSync(mainPath + '/bbb');
    });

    test('Test rename the directory, but the old path is not existed', async () => {
      await expect(FileUtil.rename(mainPath + '/aaa', mainPath + '/bbb')).rejects.toThrowError(FileNotFoundError);
    });
  });

  describe('Test copy', () => {
    const dirFrom = './testdata/rrr';
    const underDirDirectoryFrom = './testdata/rrr/iii/jjj/rrr';
    const underDirFileFrom = './testdata/rrr/iii/jjj/bbb.txt';
    const content = 'I am test';
    const publicKeyPath = './ssh-key/public.pem';
    const privateKeyPath = './ssh-key/id_rsa';

    describe('Test success to copy file with strategy', () => {
      test(`Test success to copy file with strategy`, async () => {
        const to = './testdata/fff.txt';
        const fileFrom = './testdata/bbb.txt';
        const strategies: CopyStrategy[] = [
          new SimpleCopy(fileFrom, to),
          new CopyWithEncrypt(publicKeyPath, fileFrom, to),
          new CopyWithDecrypt(privateKeyPath, fileFrom, to)
        ];
        const inputs: string[] = await Promise.all([
          content,
          content,
          EncryptUtil.encryptString(publicKeyPath, content).then((result) => result + '\n')
        ]);
        const outputs: string[] = await Promise.all([content, content, content]);
        for (let i = 0; i < strategies.length; i++) {
          fs.writeFileSync(fileFrom, inputs[i]);
          await FileUtil.copy(strategies[i]);
          let result = fs.readFileSync(to).toString().trim();
          if (strategies[i] instanceof CopyWithEncrypt) {
            result = await EncryptUtil.decryptString(privateKeyPath, result);
          }
          expect(result).toBe(outputs[i]);
          fs.unlinkSync(to);
          fs.unlinkSync(fileFrom);
        }
      });
    });

    describe('Test success to copy directory', () => {
      const cases: { name: string; to: string; unlinkMainDir: string }[] = [
        { name: `without '/'`, to: './testdata/fgh', unlinkMainDir: './testdata/fgh' },
        { name: `with '/'`, to: './testdata/fgh/', unlinkMainDir: './testdata/fgh/rrr' }
      ];

      for (const c of cases) {
        const to = c.to;
        const strategies: CopyStrategy[] = [
          new SimpleCopy(dirFrom, to),
          new CopyWithEncrypt(publicKeyPath, dirFrom, to),
          new CopyWithDecrypt(privateKeyPath, dirFrom, to)
        ];
        let inputs: any = Promise.all([
          content,
          content,
          EncryptUtil.encryptString(publicKeyPath, content).then((result) => result + '\n')
        ]);
        for (let i = 0; i < strategies.length; i++) {
          test(`Test ${strategies.constructor.name} success to copy directory ${c.name}`, async () => {
            inputs = await inputs;
            fs.mkdirSync(underDirDirectoryFrom, { recursive: true });
            fs.writeFileSync(underDirFileFrom, inputs[i]);
            await FileUtil.copy(strategies[i]);
            fs.unlinkSync(`${c.unlinkMainDir}/iii/jjj/bbb.txt`);
            fs.rmdirSync(`${c.unlinkMainDir}/iii/jjj/rrr`);
            fs.rmdirSync(`${c.unlinkMainDir}/iii/jjj`);
            fs.rmdirSync(`${c.unlinkMainDir}/iii`);
            fs.rmdirSync(c.unlinkMainDir);
            if (fs.existsSync(to)) {
              fs.rmdirSync(c.to);
            }

            fs.unlinkSync(underDirFileFrom);
            fs.rmdirSync(`./testdata/rrr/iii/jjj/rrr`);
            fs.rmdirSync(`./testdata/rrr/iii/jjj`);
            fs.rmdirSync(`./testdata/rrr/iii`);
            fs.rmdirSync(`./testdata/rrr`);
          });
        }
      }
    });

    describe('Test copy nothing, due to the excluding list', () => {
      const cases: { name: string; to: string; unlinkMainDir: string }[] = [
        { name: `without '/'`, to: './testdata/fgh', unlinkMainDir: './testdata/fgh' },
        { name: `with '/'`, to: './testdata/fgh/', unlinkMainDir: './testdata/fgh/rrr' }
      ];

      const excludeList: (string | RegExp)[] = [/rrr/];

      for (const c of cases) {
        const to = c.to;
        const strategies: CopyStrategy[] = [
          new SimpleCopy(dirFrom, to),
          new CopyWithEncrypt(publicKeyPath, dirFrom, to),
          new CopyWithDecrypt(privateKeyPath, dirFrom, to)
        ];
        let inputs: any = Promise.all([
          content,
          content,
          EncryptUtil.encryptString(publicKeyPath, content).then((result) => result + '\n')
        ]);
        for (let i = 0; i < strategies.length; i++) {
          test(`Test ${strategies[i].constructor.name} copy nothing ${c.name}, due to the excluding list`, async () => {
            inputs = await inputs;
            fs.mkdirSync(underDirDirectoryFrom, { recursive: true });
            fs.writeFileSync(underDirFileFrom, inputs[i]);
            await FileUtil.copy(strategies[i], { excludes: excludeList });

            fs.unlinkSync(underDirFileFrom);
            fs.rmdirSync(`./testdata/rrr/iii/jjj/rrr`);
            fs.rmdirSync(`./testdata/rrr/iii/jjj`);
            fs.rmdirSync(`./testdata/rrr/iii`);
            fs.rmdirSync(`./testdata/rrr`);

            // Be failed to copy.
            expect(fs.existsSync(`${c.unlinkMainDir}/iii/jjj/bbb.txt`)).toBe(false);
          });
        }
      }
    });
  });

  describe('Test copyFileWithEncryption', () => {
    const content = 'I am test';
    const publicKeyPath = './ssh-key/public.pem';
    const privateKeyPath = './ssh-key/id_rsa';

    test('Test copyFileWithEncryption with a file', async () => {
      const to = './testdata/ddd.txt';
      const fileFrom = './testdata/bbb.txt';

      fs.writeFileSync(fileFrom, content);
      await FileUtil.copyFileWithEncryption(publicKeyPath, fileFrom, to);
      await EncryptUtil.decryptFile(privateKeyPath, to, fileFrom);
      const decrypted = fs.readFileSync(fileFrom).toString();
      expect(decrypted).toBe(content);
      fs.unlinkSync(to);
      fs.unlinkSync(fileFrom);
    });

    test('Test copyFileWithEncryption with a directory', async () => {
      const to = './testdata/ddd.txt';
      const fileFrom = './testdata';

      await expect(FileUtil.copyFileWithEncryption(publicKeyPath, fileFrom, to)).rejects.toThrowError(IsDirectoryError);
    });
  });

  describe('Test copyFileWithDecryption', () => {
    const content = 'I am test';
    const publicKeyPath = './ssh-key/public.pem';
    const privateKeyPath = './ssh-key/id_rsa';

    test('Test copyFileWithDecryption with a file', async () => {
      const to = './testdata/ddd.txt';
      const fileFrom = './testdata/bbb.txt';

      fs.writeFileSync(fileFrom, content);
      await EncryptUtil.encryptFile(publicKeyPath, fileFrom, to);
      await FileUtil.copyFileWithDecryption(privateKeyPath, to, fileFrom);
      const decrypted = fs.readFileSync(fileFrom).toString();
      expect(decrypted).toBe(content);
      fs.unlinkSync(to);
      fs.unlinkSync(fileFrom);
    });

    test('Test copyFileWithDecryption with a directory', async () => {
      const to = './testdata/ddd.txt';
      const fileFrom = './testdata';

      await expect(FileUtil.copyFileWithDecryption(publicKeyPath, fileFrom, to)).rejects.toThrowError(IsDirectoryError);
    });
  });
});
