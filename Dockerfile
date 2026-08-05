FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist/bunker-ui/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.js.template /usr/share/nginx/html/env.js.template
COPY docker-entrypoint.d/20-generate-runtime-env.sh /docker-entrypoint.d/20-generate-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/20-generate-runtime-env.sh
EXPOSE 80
