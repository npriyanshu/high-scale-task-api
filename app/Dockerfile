# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3000

# Default command to run the server
# To run consumers/workers, override this command (e.g., 'npm run start:consumer:ingest')
CMD ["npm", "start"]
