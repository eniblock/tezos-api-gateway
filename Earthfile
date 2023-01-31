VERSION 0.6

deps:
    FROM node:14-alpine3.12
    WORKDIR /usr/src/app
    RUN apk add curl bash python3 make git
    RUN curl -s https://smartpy.io/cli/install.sh | bash -s -- --yes --prefix /usr/local/smartpy/
    COPY package.json package-lock.json ./
    RUN npm i

docker:
    FROM +deps
    COPY tsconfig.json .
    COPY test test
    COPY src src
    RUN npm run build
    CMD ["node", "build/src/processes/web/index.js"]
    ARG tag=latest
    ARG ref=eniblock/tezos-api-gateway:${tag}
    SAVE IMAGE --push ${ref}

test:
    FROM +deps
    COPY --dir .nvmrc .prettierrc.json LICENSE.txt jest.config.js src test tsconfig.json tslint.json yarn.lock ./
    COPY docker-compose-test.yml ./
    WITH DOCKER --compose docker-compose-test.yml
        RUN npm test
    END

sonar:
    FROM sonarsource/sonar-scanner-cli
    RUN apk add yq
    RUN git config --global --add safe.directory /usr/src
    COPY . ./
    COPY --if-exists .git .git
    RUN echo sonar.projectVersion=$(yq eval .version helm/tezos-api-gateway/Chart.yaml) >> sonar-project.properties
    ENV SONAR_HOST_URL=https://sonarcloud.io
    RUN --mount=type=cache,target=/opt/sonar-scanner/.sonar/cache \
        --secret GITHUB_TOKEN \
        --secret SONAR_TOKEN \
        sonar-scanner
