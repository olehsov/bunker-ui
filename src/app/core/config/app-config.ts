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
 * Cloud Run URL for bunker-ui. Keep in sync with index.html, robots.txt and
 * sitemap.xml if this ever moves to a custom domain. Used for canonical/OG
 * URLs, which must be absolute.
 */
export const SITE_URL = 'https://bunker-ui-708695421901.us-east1.run.app';
