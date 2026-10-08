import netlifyIdentity from 'netlify-identity-widget';
import { isPixelLandingPage, trackPixelLead, trackPixelPage } from './openaiPixel';

jest.mock('netlify-identity-widget', () => ({ currentUser: jest.fn(() => null) }));

beforeEach(() => {
  window.history.replaceState({}, '', '/painting');
  window.oaiq = jest.fn();
  netlifyIdentity.currentUser.mockReturnValue(null);
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false });
});

test('covers every service landing page and excludes private pages', () => {
  ['/', '/painting', '/drywall', '/cleaning', '/home-services', '/service-area/naples-painter'].forEach(path => expect(isPixelLandingPage(path)).toBe(true));
  ['/crm/dashboard', '/quote/secret', '/invoice/secret', '/login'].forEach(path => expect(isPixelLandingPage(path)).toBe(false));
});

test('sends documented page and lead events without form data', () => {
  trackPixelPage();
  trackPixelLead();
  expect(window.oaiq).toHaveBeenCalledWith('init', { pixelId: 'XrhDDSkujrX5jWjxT9rdUA', debug: false });
  expect(window.oaiq).toHaveBeenCalledWith('measure', 'page_viewed', { type: 'contents' });
  expect(window.oaiq).toHaveBeenCalledWith('measure', 'lead_created', { type: 'customer_action' });
});

test('does not send events for staff, private routes, or privacy opt-outs', () => {
  netlifyIdentity.currentUser.mockReturnValue({ id: 'staff' });
  trackPixelLead();
  netlifyIdentity.currentUser.mockReturnValue(null);
  window.history.replaceState({}, '', '/quote/secret');
  trackPixelPage();
  window.history.replaceState({}, '', '/painting');
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
  trackPixelLead();
  expect(window.oaiq).not.toHaveBeenCalled();
});

test('tracking errors never break form success handling', () => {
  window.oaiq.mockImplementation(() => { throw new Error('blocked'); });
  expect(() => trackPixelLead()).not.toThrow();
});
