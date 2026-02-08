# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run uses this)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]