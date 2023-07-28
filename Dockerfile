FROM node:18.17-alpine3.18 AS build
ENV NODE_ENV production
WORKDIR /usr/app

# Copy the Node.js application files into the container
COPY package.json package-lock.json ./
COPY src/index.js ./src/index.js

# Install the latest npm version
RUN npm install -g npm@9.8.1
# Install application dependencies
RUN npm install

FROM gcr.io/distroless/nodejs18-debian11
COPY --from=build /usr/app /usr/app
WORKDIR /usr/app

# Set the default value for CRON_EXPRESSION environment variable (every 5 minutes)
ENV CRON_EXPRESSION "*/5 * * * *"
ENV ZONE_ID REPLACE_ME
ENV API_TOKEN REPLACE_ME
ENV RECORD_ID REPLACE_ME

#Run node app
CMD ["./src/index.js"]
