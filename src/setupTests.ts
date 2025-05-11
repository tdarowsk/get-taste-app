import "@testing-library/jest-dom";
import { vi } from "vitest";

global.fetch = vi.fn().mockImplementation((url) => {
  // Zamień relatywny URL na absolutny, jeśli trzeba
  if (typeof url === "string" && url.startsWith("/")) {
    url = "http://localhost" + url;
  }
  // Zwracaj odpowiednie dane dla /preferences
  if (typeof url === "string" && url.includes("/preferences")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          filmPreferences: {
            genres: ["action", "drama"],
            liked_movies: ["Movie 1", "Movie 2"],
          },
        }),
    });
  }
  // Domyślna odpowiedź
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});
