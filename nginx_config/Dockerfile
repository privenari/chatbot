FROM node:20-alpine AS builder
WORKDIR /app
COPY reserva/package*.json ./
RUN npm ci
COPY reserva/ ./
RUN npm run build

FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx_config/default.conf /etc/nginx/conf.d/default.conf
