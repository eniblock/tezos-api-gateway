FROM node:14-alpine as deps

WORKDIR /usr/src/app

RUN apk add curl bash python3 make
RUN wget -O - https://smartpy.io/cli/install.sh | sh -s local-install /usr/local/smartpy/

COPY package.json package-lock.json ./
RUN npm i

FROM deps as builder
COPY tsconfig.json .
COPY test test
COPY src src
RUN npm run build

# dev image with live update
FROM builder as dev
RUN npm install -g bunyan nodemon
COPY nodemon.json .
CMD nodemon $SCRIPT | bunyan

# final image
FROM builder
CMD node $SCRIPT
