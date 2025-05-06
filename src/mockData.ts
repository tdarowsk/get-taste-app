import type { RecommendationDTO, RecommendationItem } from "./types";

// Mock recommendations for when the API returns no results or for testing
export const mockMusicRecommendations: RecommendationDTO[] = [
  {
    id: 9001,
    user_id: 1,
    type: "music",
    data: {
      title: "Popular Music Tracks",
      description: "Some of the most popular music tracks right now.",
      items: [
        {
          id: "song-1",
          name: "As It Was",
          type: "song",
          details: {
            artist: "Harry Styles",
            genres: ["pop", "indie"],
            popularity: 95,
            imageUrl: "https://i.scdn.co/image/ab67616d00001e02b46f74097655d7f353caab14",
            spotifyId: "4LRPiXqCikLlN15c3yImP7",
          },
        },
        {
          id: "song-2",
          name: "Heat Waves",
          type: "song",
          details: {
            artist: "Glass Animals",
            genres: ["indie pop", "psychedelic pop"],
            popularity: 94,
            imageUrl: "https://i.scdn.co/image/ab67616d00001e02712701c5e263efc8726b1464",
            spotifyId: "02MWAaffLxlfxAUY7c5dvx",
          },
        },
        {
          id: "album-1",
          name: "Harry's House",
          type: "album",
          details: {
            artist: "Harry Styles",
            year: 2022,
            tracks: 13,
            imageUrl: "https://i.scdn.co/image/ab67616d00001e02b46f74097655d7f353caab14",
            spotifyId: "5r36AJ6VOJtp00oxSkBZ5h",
          },
        },
        {
          id: "artist-1",
          name: "Bad Bunny",
          type: "artist",
          details: {
            genres: ["reggaeton", "latin trap"],
            popularity: 97,
            spotifyId: "4q3ewBCX7sLwd24euuV69X",
          },
        },
        {
          id: "album-2",
          name: "Un Verano Sin Ti",
          type: "album",
          details: {
            artist: "Bad Bunny",
            year: 2022,
            tracks: 23,
            imageUrl: "https://i.scdn.co/image/ab67616d00001e02d6f58ce654162beef9eafe39",
            spotifyId: "3RQQmkQEvNCY4prGKE6oc5",
          },
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
];
