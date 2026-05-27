// MapLibre and other browser-API-dependent code cannot run during SSR.
// Disable server-side rendering for this route so the static adapter
// outputs an empty HTML shell that hydrates cleanly in the browser.
export const ssr = false;
export const prerender = true;
