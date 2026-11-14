/**
 * Vercel Speed Insights initialization
 * Automatically tracks web vitals and performance metrics
 */
import { injectSpeedInsights } from './speed-insights-lib.mjs';

// Only initialize Speed Insights in production/Vercel environments
const isProduction =
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

if (isProduction) {
  injectSpeedInsights({
    debug: false, // Set to true to enable debug logging
  });
}