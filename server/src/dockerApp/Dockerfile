FROM alpine:latest
RUN apk add --no-cache build-base 
RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache --update nodejs npm
RUN mkdir app
RUN wget https://raw.githubusercontent.com/msc24x/Hunter/main/server/src/dockerApp/tester.py > app/tester.py
RUN mkdir app/files