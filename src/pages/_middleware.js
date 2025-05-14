// Importuj polyfills przed obsługą żądań
import "../polyfills.js";

export const onRequest = async (context, next) => {
  // Kontynuuj obsługę żądania
  return await next();
};
