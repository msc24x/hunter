FROM node:lts-slim

WORKDIR /home/app

COPY . .

RUN apt-get update && apt-get install -y openssl

RUN npm install

ARG ENV

ENV ENV ${ENV}

EXPOSE 8080
CMD npm run start-${ENV}
