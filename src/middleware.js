// Import funkcji polyfill
import { applyMessageChannelPolyfill } from "./polyfills.js";

// Middleware wykonywane przed obsługą każdego żądania
export function onRequest(context, next) {
  // Zastosuj polyfill
  applyMessageChannelPolyfill();

  // Kontynuuj obsługę żądania
  return next();
}
