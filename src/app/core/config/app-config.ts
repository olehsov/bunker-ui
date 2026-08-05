interface RuntimeEnv {
  apiBaseUrl?: string;
  wsBaseUrl?: string;
}

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

const runtimeEnv = typeof window !== 'undefined' ? window.__env : undefined;

export const API_BASE_URL = runtimeEnv?.apiBaseUrl || 'http://localhost:3000';
export const WS_BASE_URL = runtimeEnv?.wsBaseUrl || 'http://localhost:3000';
export const WS_NAMESPACE = '/game';

/**
 * TODO: replace with the real production domain once it's decided, and keep
 * it in sync with the same placeholder in index.html, robots.txt and
 * sitemap.xml. Used for canonical/OG URLs, which must be absolute.
 */
export const SITE_URL = 'https://bunker.example';
