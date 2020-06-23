FROM node:lts-alpine AS builder
WORKDIR /etc/app
COPY . ./
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git  openssh-client  openssh-keygen && \
  npm install --quiet node-gyp -g && mkdir ssh-key && ssh-keygen  -m PEM -b 1024 -q -t rsa -N '' -f /etc/app/ssh-key/id_rsa && ssh-keygen  -b 1024 -f /etc/app/ssh-key/id_rsa.pub -m PEM -e > /etc/app/ssh-key/public.pem && yarn install && npm run build && rm -rf /usr/local/lib/node_modules/npm/ /usr/local/bin/npm && mkdir testdata


FROM node:lts-alpine AS dependencies
WORKDIR /etc/app
COPY . ./
RUN yarn install --production && yarn add -D jest supertest

FROM node:lts-alpine
WORKDIR /etc/app
COPY --from=dependencies /etc/app/node_modules ./node_modules
COPY --from=builder /etc/app/dist ./dist
COPY --from=builder /etc/app/bin ./bin
COPY --from=builder /etc/app/package.json .
COPY --from=builder /etc/app/jest.config.json .
COPY --from=builder /etc/app/ssh-key /etc/app/ssh-key
COPY --from=builder /etc/app/testdata /etc/app/testdata
CMD npm run test:ci