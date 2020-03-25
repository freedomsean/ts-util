FROM node:lts-alpine AS builder
WORKDIR /etc/app
ADD . ./
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git && \
  npm install --quiet node-gyp -g
RUN npm run build


FROM node:lts-alpine
WORKDIR /etc/app
COPY --from=builder /etc/app/dist ./dist
COPY --from=builder /etc/app/bin ./bin
COPY --from=builder /etc/app/node_modules ./node_modules
COPY --from=builder /etc/app/package.json .
COPY --from=builder /etc/app/jest.config.json .
COPY --from=builder /etc/app/ssh-key ./ssh-key
RUN mkdir testdata && chmod -R 777 bin
CMD npm run test-ci