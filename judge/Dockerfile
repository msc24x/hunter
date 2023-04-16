FROM alpine:latest
RUN apk add --no-cache build-base \ 
    && apk add --no-cache python3 py3-pip \
    && apk add --no-cache --update nodejs npm
RUN mkdir app
RUN mkdir app/files
COPY judge.py app/judge.py