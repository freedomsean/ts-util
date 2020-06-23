import { LogUtil } from '../../util/log-util';
import * as winston from 'winston';
import * as fs from 'fs';

const LOG_FILE_PATH: string = './testdata/combined.log';

describe('Test RequestUtil', () => {
  beforeAll(() => {
    LogUtil.init({
      transports: [new winston.transports.File({ filename: LOG_FILE_PATH })]
    });
  });

  describe('Test log', () => {
    test('Test log', (done: jest.DoneCallback) => {
      LogUtil.getInstance().info('aaa', { s: 1 });
      LogUtil.getInstance().error('bbb', { b: 1 });
      LogUtil.getInstance().info('ccc', { s: 2 });
      setTimeout(() => {
        try {
          const contents: string = fs.readFileSync(LOG_FILE_PATH).toString();
          const data: any[] = contents.split('\n');
          expect(data[0].trim()).toBe(JSON.stringify({ s: 1, level: 'info', message: 'aaa' }));
          expect(data[1].trim()).toBe(JSON.stringify({ b: 1, level: 'error', message: 'bbb' }));
          expect(data[2].trim()).toBe(JSON.stringify({ s: 2, level: 'info', message: 'ccc' }));
          fs.unlinkSync(LOG_FILE_PATH);
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });
  });
});
