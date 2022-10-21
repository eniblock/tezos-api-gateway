VERSION 0.6

test:
    FROM node:14.15.4-alpine3.12
    RUN apk add curl bash python3
    RUN curl -s https://smartpy.io/cli/install.sh | bash -s -- --yes --prefix /usr/local/smartpy/
    WORKDIR /app
    COPY --dir package*.json ./
    RUN npm i
    COPY --dir .nvmrc .prettierrc.json LICENSE.txt jest.config.js src test tsconfig.json tslint.json yarn.lock ./
    COPY docker-compose-test.yml ./
    WITH DOCKER --compose docker-compose-test.yml
        RUN npm test
    END
