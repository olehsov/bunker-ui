// Default runtime config for local development (`ng serve` / `ng build`).
// In the Docker image this exact file is regenerated at container startup
// from API_BASE_URL / WS_BASE_URL env vars — see docker-entrypoint.d/20-generate-runtime-env.sh.
window.__env = {
  apiBaseUrl: 'http://localhost:3000',
  wsBaseUrl: 'http://localhost:3000',
};
