# --- Build stage -----------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /repo

RUN corepack enable

# Copy workspace manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts/kusuricheck ./artifacts/kusuricheck

RUN pnpm install --frozen-lockfile

# Generate API client (frontend imports it).
RUN pnpm --filter @workspace/api-spec run codegen || true

ENV BASE_PATH=/
RUN pnpm --filter @workspace/kusuricheck run build

# --- Runtime stage ---------------------------------------------------------
FROM nginx:1.27-alpine

COPY --from=build /repo/artifacts/kusuricheck/dist /usr/share/nginx/html

# Single-page app fallback + reverse-proxy /api to the api-server container.
RUN printf '%s\n' \
    'server {' \
    '  listen 80;' \
    '  server_name _;' \
    '  root /usr/share/nginx/html;' \
    '  index index.html;' \
    '  location /api/ {' \
    '    proxy_pass http://api:8080;' \
    '    proxy_set_header Host $host;' \
    '    proxy_set_header X-Real-IP $remote_addr;' \
    '  }' \
    '  location / {' \
    '    try_files $uri /index.html;' \
    '  }' \
    '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
