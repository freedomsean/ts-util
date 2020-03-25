FROM node:lts-alpine AS builder
WORKDIR /etc/app

COPY . ./
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git openssh && \
  npm install --quiet node-gyp -g
RUN mkdir ssh-key && ssh-keygen -b 1024 -q -t rsa -N '' -f /etc/app/ssh-key/id_rsa && ssh-keygen  -b 1024 -f /etc/app/ssh-key/id_rsa.pub -m "PEM" -e > /etc/app/ssh-key/public.pem
RUN npm install
RUN npm run build


FROM node:lts-alpine
WORKDIR /etc/app
COPY --from=builder /etc/app/dist ./dist
COPY --from=builder /etc/app/bin ./bin
COPY --from=builder /etc/app/node_modules ./node_modules
COPY --from=builder /etc/app/package.json .
COPY --from=builder /etc/app/jest.config.json .
COPY --from=builder /etc/app/ssh-key /etc/app/ssh-key
RUN mkdir testdata && chmod -R 777 bin
CMD npm run test-ci