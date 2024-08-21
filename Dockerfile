# Based off: https://github.com/Rob--W/cors-anywhere/pull/137

# Stage 1: Clone the repository and install dependencies
FROM alpine/git as clone
WORKDIR /app
RUN git clone https://github.com/Rob--W/cors-anywhere.git .

# Stage 2: Build the application
FROM node:15-alpine
WORKDIR /usr/src/app
COPY --from=clone /app .

RUN npm install

EXPOSE 8080

# Default to allow all origins
# ENSURE THIS IS NOT THE CASE IN PRODUCTION!
ENV CORSANYWHERE_WHITELIST=""

CMD [ "node", "server.js" ]
