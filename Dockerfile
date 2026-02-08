# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Note: Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided as build args or environment variables if needed during build time (usually runtime for client-side)
# However, Vite embeds env vars starting with VITE_ at build time. 
# For Cloud Run, usually we want to inject these at runtime, but Vite is static.
# We will assume environment variables are passed as build args or .env is copied (we dockerignored .env).
# Best practice for Vite in Docker: Pass args or use a placeholder replacement script at runtime.
# For simplicity, we'll assume the user will build with necessary args or use a generic build.
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
