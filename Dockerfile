FROM node:14.16-alpine3.12

WORKDIR /usr/src/app

RUN apk add curl bash python3 make

RUN wget -O - https://smartpy.io/cli/install.sh | sh -s local-install /usr/local/smartpy/

COPY package.json package-lock.json ./

RUN npm i

COPY tsconfig.json .
COPY test test
COPY src src

RUN npm run build

CMD ["node", "build/src/processes/web/index.js"]
