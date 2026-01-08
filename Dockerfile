# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create data directory for file storage
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variables
ENV PORT=3001
ENV STORAGE_TYPE=file
ENV DATA_DIR=/app/data

# Start the server
CMD ["node", "backend/src/server.js"]
