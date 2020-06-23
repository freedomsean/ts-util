# ts-util

[![CircleCI](https://circleci.com/gh/freedomsean/ts-util.svg?style=svg)](https://circleci.com/gh/freedomsean/ts-util) [![codecov](https://codecov.io/gh/freedomsean/ts-util/branch/master/graph/badge.svg)](https://codecov.io/gh/freedomsean/ts-util)

This is a utility library by NodeJS and Typescript

If you want to use this util, I hope you can tell me and add the author information in the head of the file, thanks.

The library can be used in commercial and personal purpose.

## Development

### Pre-requirement

- install dependency

```
npm install
```

- generate ssh key for EncryptUtil, if you need it
  
```
apt-get update && apt-get -y install openssh-client && mkdir ssh-key && ssh-keygen -q  -m PEM  -t rsa -N '' -f /etc/app/ssh-key/id_rsa && ssh-keygen -f /etc/app/ssh-key/id_rsa.pub -m PEM -e > /etc/app/ssh-key/public.pem
```

- make `testdata` directory in the project dir

### Testing

```
npm run test
```

To Note that, test cases of `RedisClient` are skipped. If you want to test that, it has to add your own redis host.

## Structure

```
src
├── middleware
│   ├── error-handler.ts    # express middleware
│   └── http-response.ts    # formats of http response
└── util
    ├── encrypt-util.ts     # encrypt string or file
    ├── env-util.ts         # read the process.env
    ├── file-util.ts        # process files
    ├── log-util.ts         # log by winston
    ├── redis-client.ts     # facade for redis
    ├── regex-util.ts       # regex utilities
    └── request-util.ts     # http request by axios
```
