import type { APIRoute } from "astro";
import type { UserTasteDTO, MusicTasteProfile, FilmTasteProfile } from "../../types";

export const prerender = false;

/**
 * GET /api/test-taste
 * Test endpoint for the taste feature that doesn't require authentication
 */
export const GET: APIRoute = async () => {
  // Create a mock taste profile for testing
  const mockMusicTaste: MusicTasteProfile = {
    genres: ["rock", "indie", "electronic"],
    mood: ["energiczny", "refleksyjny", "nowoczesny"],
    style: "alternatywne odkrycia",
    intensity: 7,
    variety: 8,
  };

  const mockFilmTaste: FilmTasteProfile = {
    genres: ["drama", "sci-fi", "thriller"],
    mood: ["emocjonalny", "wizjonerski", "napięcie"],
    style: "kreatywne światy",
    intensity: 6,
    variety: 7,
  };

  const mockTasteProfile: UserTasteDTO = {
    name: "Wszechstronny Odkrywca",
    description:
      'Twój gust charakteryzuje się szerokim spektrum zainteresowań w różnorodnych gatunkach muzycznych i filmowych. Preferujesz muzykę określaną jako "alternatywne odkrycia" oraz filmy w stylu "kreatywne światy".',
    music: mockMusicTaste,
    film: mockFilmTaste,
  };

  return new Response(JSON.stringify(mockTasteProfile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
