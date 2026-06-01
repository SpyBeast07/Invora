# ==============================================================================
# Multi-Stage Build: Node Compilation Stage
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==============================================================================
# Multi-Stage Build: Caddy Production Web Server Stage
# ==============================================================================
FROM caddy:alpine AS runner
WORKDIR /usr/share/caddy
RUN rm -rf /usr/share/caddy/*

# Copy compiled static directory from builder stage
COPY --from=builder /app/dist /usr/share/caddy

# Copy custom Caddy configuration for SPA routing & compression
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
