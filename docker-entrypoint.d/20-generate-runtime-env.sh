#!/bin/sh
# Regenerates env.js from API_BASE_URL / WS_BASE_URL at container startup, so the
# same image can be pointed at different backends via `docker run -e` / compose
# `environment:` without rebuilding. Runs automatically — nginx's own entrypoint
# executes every executable script in this directory before starting nginx.
set -eu

export API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
export WS_BASE_URL="${WS_BASE_URL:-http://localhost:3000}"

envsubst '${API_BASE_URL} ${WS_BASE_URL}' \
  < /usr/share/nginx/html/env.js.template \
  > /usr/share/nginx/html/env.js
