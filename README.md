# ts-util



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
apt-get update && apt-get -y install openssh-client && mkdir ssh-key && ssh-keygen -q -t rsa -N '' -f /etc/app/ssh-key/id_rsa && ssh-keygen -f /etc/app/ssh-key/id_rsa.pub -m "PEM" -e > /etc/app/ssh-key/public.pem
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
│   ├── ErrorHandler.ts                 # express middleware, to have a general response format 
│   └── HttpResponse.ts                 # all format developed already
└── util
    ├── EncryptUtil.ts                  # to encrypt the file/string
    ├── EnvUtil.ts                      # read the process.env
    ├── FileUtil.ts                     # process files
    ├── LogUtil.ts                      # log data by winston
    ├── RedisClient.ts                  # facade for redis
    ├── RegexUtil.ts                    # regex utilities
    └── RequestUtil.ts                  # http request by axios
```

## TODO

- To make sure both windows and linux can use the same npm script

