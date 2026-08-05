interface RuntimeEnv {
  apiBaseUrl?: string;
  wsBaseUrl?: string;
}

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

const runtimeEnv = window.__env;

export const API_BASE_URL = runtimeEnv?.apiBaseUrl || 'http://localhost:3000';
export const WS_BASE_URL = runtimeEnv?.wsBaseUrl || 'http://localhost:3000';
export const WS_NAMESPACE = '/game';
