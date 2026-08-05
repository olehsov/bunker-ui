import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Only the static marketing/entry pages are prerendered (SEO matters there).
 * Room pages are tied to a specific in-memory session on the backend and a
 * playerId in the visitor's own localStorage, so there's nothing meaningful
 * to prerender or index — they stay pure client-side rendering.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'create', renderMode: RenderMode.Prerender },
  { path: 'join', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
