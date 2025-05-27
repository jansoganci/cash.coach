# Use the official Node.js 20 image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm retry settings
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the correct port
EXPOSE 5000

# Command to run the application
CMD ["npm", "run", "dev"]