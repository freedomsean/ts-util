FROM node:10.16.0-jessie AS builder
WORKDIR /etc/app
ADD . ./
RUN apt-get update && apt-get -y install openssh-client && mkdir ssh-key && ssh-keygen -q -t rsa -N '' -f /etc/app/ssh-key/id_rsa && ssh-keygen -f /etc/app/ssh-key/id_rsa.pub -m "PEM" -e > /etc/app/ssh-key/public.pem &&  npm install 
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