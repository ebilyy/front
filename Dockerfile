# ---- build: vite build -> dist ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# У проді фронт і API на одному домені: Caddy проксує /api на бекенд.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build-only

# ---- production: статика за Caddy, без Node ----
FROM caddy:2.11-alpine AS production
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
USER nobody
EXPOSE 8080
