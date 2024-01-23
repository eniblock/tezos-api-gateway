FROM node:14-alpine3.12

WORKDIR /usr/src/app

RUN apk add curl bash python3 make

RUN curl -s https://legacy.smartpy.io/cli/install.sh | bash -s -- --yes --prefix /usr/local/smartpy/

COPY package.json package-lock.json ./

RUN npm i

COPY tsconfig.json .
COPY test test
COPY src src

RUN npm run build

CMD ["node", "build/src/processes/web/index.js"]
