import netlifyIdentity from 'netlify-identity-widget';

const pixelId = 'XrhDDSkujrX5jWjxT9rdUA';
let initialized = false;
export const isPixelLandingPage = path => /^\/(?:painting|drywall|cleaning|home-services)?\/?$/.test(path) || /^\/service-area\/[a-z0-9-]{1,80}\/?$/.test(path);

export function pixelAllowed() {
  return ['brushlineservices.com', 'www.brushlineservices.com'].includes(window.location.hostname)
    && isPixelLandingPage(window.location.pathname)
    && !netlifyIdentity.currentUser()
    && navigator.doNotTrack !== '1' && window.doNotTrack !== '1' && !navigator.globalPrivacyControl;
}

function initialize() {
  if (!pixelAllowed()) return false;
  if (!initialized) {
    if (!window.oaiq) {
      const queue = function () { queue.q.push(arguments); };
      queue.q = [];
      window.oaiq = queue;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';
      document.head.appendChild(script);
    }
    window.oaiq('init', { pixelId, debug: false });
    initialized = true;
  }
  return true;
}

export function trackPixelPage() {
  try {
    if (initialize()) window.oaiq('measure', 'page_viewed', { type: 'contents' });
  } catch { /* Measurement must never interrupt the website. */ }
}

export function trackPixelLead() {
  try {
    if (initialize()) window.oaiq('measure', 'lead_created', { type: 'customer_action' });
  } catch { /* A tracking failure must not turn a successful request into an error. */ }
}
