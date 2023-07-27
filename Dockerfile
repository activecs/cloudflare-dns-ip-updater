# Use the official Node.js image as the base image
FROM node:18.17.0-alpine3.18

# Set the working directory inside the container
WORKDIR /usr/app

# Copy the Node.js application files into the container
COPY package.json package-lock.json ./
COPY src/index.js ./src/index.js

# Install application dependencies
RUN npm install

# Set the default value for CRON_EXPRESSION environment variable (every 5 minutes)
ENV CRON_EXPRESSION "*/5 * * * *"
ENV ZONE_ID REPLACE_ME
ENV API_TOKEN REPLACE_ME
ENV RECORD_ID REPLACE_ME

#Run node app
CMD ["node", "src/index.js"]
