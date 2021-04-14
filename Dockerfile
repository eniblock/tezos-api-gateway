FROM node:14.15.4-alpine3.12

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm i

COPY tsconfig.json .
COPY src src

RUN npm run build

CMD ["node", "build/src/processes/web/index.js"]