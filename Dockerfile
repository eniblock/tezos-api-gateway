FROM node:14.16-alpine3.12

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm i

COPY tsconfig.json .
COPY test test
COPY src src

RUN npm run build

CMD ["node", "build/src/processes/web/index.js"]
