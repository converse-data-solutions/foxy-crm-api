# ------------------ Builder Stage ------------------
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy all source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --omit=dev

# ------------------ Production Stage ------------------
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy only production files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose API port
EXPOSE 8000

# Default environment variable (optional, can override with --env-file)
ENV NODE_ENV=production

# Start the app
CMD ["npm", "run", "start:prod"]
