# Production Dockerfile for SpendWise Node.js Express API Server
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Non-root user for security
USER node

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/index.js"]
