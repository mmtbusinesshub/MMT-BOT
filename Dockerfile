# Use official Node.js image
FROM node:20-bullseye-slim

# Install necessary dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create auth directory
RUN mkdir -p /app/auth_info_baileys

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
