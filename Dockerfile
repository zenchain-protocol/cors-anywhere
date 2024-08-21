# Based off: https://github.com/Rob--W/cors-anywhere/pull/137
FROM node:15-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
# Default to allow all origins
# ENSURE THIS IS NOT THE CASE IN PRODUCTION!
ENV CORSANYWHERE_WHITELIST=""

CMD [ "node", "server.js" ]
