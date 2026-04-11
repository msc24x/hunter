FROM node:lts-slim

WORKDIR /home/app

RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./

RUN npm install --include=dev

COPY . .

ARG ENV

ENV ENV ${ENV}

CMD npm run start-${ENV}
