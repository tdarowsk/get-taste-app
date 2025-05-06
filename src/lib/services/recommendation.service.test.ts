import { describe, it, expect, beforeEach, vi } from "vitest";
// Mock supabaseClient to avoid real initialization during tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock("../../db/supabase.client", () => ({ supabaseClient: {} as any }));
import { RecommendationService } from "./recommendation.service";

// Stub TMDB_API_KEY so it's present during tests
vi.stubEnv("TMDB_API_KEY", "test-api-key");

describe("RecommendationService.callOpenrouterAPI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mock music recommendations when type is music", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await RecommendationService.callOpenrouterAPI({} as any, "music");
    const items = result.items ?? [];

    expect(result).toHaveProperty("title", "Music Recommendations");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: "mock-music-1", name: "Mock Artist 1", type: "artist" });
  });

  it("fetches and maps trending movies when type is film", async () => {
    // Mock trending movies response
    const trendingResponse = {
      results: [
        {
          id: 42,
          title: "Test Movie",
          overview: "Overview text",
          poster_path: "/test.jpg",
          release_date: "2023-01-01",
          vote_average: 9.5,
          original_language: "en",
        },
      ],
    };

    // Mock detail response with credits
    const detailResponse = {
      id: 42,
      title: "Test Movie",
      overview: "Overview text",
      poster_path: "/test.jpg",
      release_date: "2023-01-01",
      vote_average: 9.5,
      original_language: "en",
      credits: {
        crew: [
          { job: "Director", name: "Test Director" },
          { job: "Writer", name: "Test Writer" },
        ],
        cast: [{ name: "Actor One" }, { name: "Actor Two" }],
      },
    };

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // First call: trending list
        .mockResolvedValueOnce({ ok: true, json: async () => trendingResponse })
        // Second call: details for each movie
        .mockResolvedValueOnce({ ok: true, json: async () => detailResponse })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await RecommendationService.callOpenrouterAPI({} as any, "film");
    const items = result.items ?? [];

    expect(result).toHaveProperty("title");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "42",
      name: "Test Movie",
      type: "film",
      details: expect.objectContaining({
        director: "Test Director",
        screenwriter: expect.stringContaining("Test Writer"),
        cast: expect.arrayContaining(["Actor One", "Actor Two"]),
        imageUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
      }),
    });
  });

  it("throws an error when the trending fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: async () => "error",
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(RecommendationService.callOpenrouterAPI({} as any, "film")).rejects.toThrow(
      "TMDB API error"
    );
  });
});
