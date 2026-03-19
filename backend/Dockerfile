FROM node:lts-slim

WORKDIR /home/app

RUN apt-get update && apt-get install -y openssl

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ARG ENV

ENV ENV ${ENV}

CMD npm run start-${ENV}
