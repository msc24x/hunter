FROM node:18

WORKDIR /home/app

COPY package.json .
RUN npm install

COPY . .

ARG ENV

ENV ENV ${ENV}

EXPOSE 8080
CMD npm run start-${ENV}
