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

// Mock recommendations for films
export const mockFilmRecommendations: RecommendationDTO[] = [
  {
    id: 9002,
    user_id: 1,
    type: "film",
    data: {
      title: "Must-Watch Movies",
      description: "Films you shouldn't miss from recent releases.",
      items: [
        {
          id: "movie-1",
          name: "Everything Everywhere All at Once",
          type: "movie",
          details: {
            director: "Daniels",
            year: 2022,
            genres: ["comedy", "drama", "sci-fi"],
            duration: 139,
            imageUrl: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
          },
        },
        {
          id: "movie-2",
          name: "The Batman",
          type: "movie",
          details: {
            director: "Matt Reeves",
            year: 2022,
            genres: ["action", "crime", "drama"],
            duration: 176,
            imageUrl: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
          },
        },
        {
          id: "movie-3",
          name: "Top Gun: Maverick",
          type: "movie",
          details: {
            director: "Joseph Kosinski",
            year: 2022,
            genres: ["action", "drama"],
            duration: 130,
            imageUrl: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
          },
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
];
