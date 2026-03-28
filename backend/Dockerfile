FROM node:lts-slim

WORKDIR /home/app

RUN apt-get update && apt-get install -y openssl

COPY . .

RUN npm install

ARG ENV

ENV ENV ${ENV}

CMD npm run start-${ENV}
