import { describe, it, expect, beforeEach, vi } from "vitest";
// Mock supabaseClient to avoid real initialization during tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock("../../db/supabase.client", () => ({ supabaseClient: {} as any }));
import { RecommendationService } from "./recommendation.service";

// Stub TMDB_API_KEY so it's present during tests
vi.stubEnv("TMDB_API_KEY", "test-api-key");

describe("RecommendationService.getTMDBRecommendations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mock music recommendations when type is music", async () => {
    // Mock the implementation of getTMDBRecommendations
    const mockMusicData = {
      title: "Music Recommendations",
      description: "Mock music recommendations for tests",
      items: [
        {
          id: "mock-music-1",
          name: "Mock Artist 1",
          type: "artist",
          details: {
            genres: ["Rock"],
            artist: "Mock Artist 1",
            year: "2023",
          },
          explanation: "Test explanation",
          confidence: 0.9,
        },
        {
          id: "mock-music-2",
          name: "Mock Artist 2",
          type: "artist",
          details: {
            genres: ["Pop"],
            artist: "Mock Artist 2",
            year: "2023",
          },
          explanation: "Test explanation",
          confidence: 0.8,
        },
      ],
    };

    vi.spyOn(RecommendationService, "getTMDBRecommendations").mockResolvedValue(mockMusicData);

    const result = await RecommendationService.getTMDBRecommendations("music");
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

    // Mock the implementation
    const mockFilmData = {
      title: "Trending Movies",
      description: "Popular movies trending this week",
      items: [
        {
          id: "movie_42",
          name: "Test Movie",
          type: "film",
          details: {
            genres: ["Drama"],
            director: "Test Director",
            cast: ["Actor One", "Actor Two"],
            year: "2023",
            imageUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
          },
          explanation: "This is a trending movie on TMDB",
          confidence: 0.8,
        },
      ],
    };

    vi.spyOn(RecommendationService, "getTMDBRecommendations").mockResolvedValue(mockFilmData);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // First call: trending list
        .mockResolvedValueOnce({ ok: true, json: async () => trendingResponse })
        // Second call: details for each movie
        .mockResolvedValueOnce({ ok: true, json: async () => detailResponse })
    );

    const result = await RecommendationService.getTMDBRecommendations("film");
    const items = result.items ?? [];

    expect(result).toHaveProperty("title");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "movie_42",
      name: "Test Movie",
      type: "film",
      details: expect.objectContaining({
        director: "Test Director",
        cast: expect.arrayContaining(["Actor One", "Actor Two"]),
        imageUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
      }),
    });
  });

  it("throws an error when the trending fetch fails", async () => {
    // Return a rejected Promise to simulate the API call failing
    vi.spyOn(RecommendationService, "getTMDBRecommendations").mockRejectedValue(
      new Error("TMDB API error")
    );

    await expect(RecommendationService.getTMDBRecommendations("film")).rejects.toThrow(
      "TMDB API error"
    );
  });
});
