FROM node:lts-slim

WORKDIR /home/app

COPY . .

RUN apt-get update && apt-get install -y openssl

RUN npm install

ARG ENV

ENV ENV ${ENV}

CMD npm run start-${ENV}
