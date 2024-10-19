FROM node:20.18.0

WORKDIR /home/app

COPY . .

RUN npm install

ARG ENV

ENV ENV ${ENV}

EXPOSE 8080
CMD npm run start-${ENV}
