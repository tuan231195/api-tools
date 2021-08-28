ARG NODE_VERSION=14-alpine
FROM node:${NODE_VERSION}

RUN npm i -g pnpm

RUN apk add --no-cache openssh-client git
