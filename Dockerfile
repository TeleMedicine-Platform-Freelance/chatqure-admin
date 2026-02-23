# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .

# Build-time env (Vite inlines these at build)
ARG VITE_APP_NAME=Katalyst Admin
ARG VITE_APP_ENVIRONMENT=production
ARG VITE_API_BASE_URL=https://stagingapi.chatqure.com/
ARG VITE_API_TIMEOUT=30000
ARG VITE_AUTH_LOGIN_PATH=/auth/login
ARG VITE_AUTH_TOKEN_KEY=katalyst_auth_token
ARG VITE_AUTH_CURRENT_USER_KEY=katalyst_auth_current_user
ARG VITE_USE_MSW=false

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_API_TIMEOUT=$VITE_API_TIMEOUT \
    VITE_AUTH_LOGIN_PATH=$VITE_AUTH_LOGIN_PATH \
    VITE_AUTH_TOKEN_KEY=$VITE_AUTH_TOKEN_KEY \
    VITE_AUTH_CURRENT_USER_KEY=$VITE_AUTH_CURRENT_USER_KEY \
    VITE_USE_MSW=$VITE_USE_MSW

RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default config and use our SPA config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check for orchestrators (K8s, ECS, Docker)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
