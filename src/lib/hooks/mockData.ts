import type { RecommendationDTO, UserPreferencesDTO } from "../../types";

// Mock recommendations for music
export const mockRecommendations: RecommendationDTO[] = [
  {
    id: 1,
    user_id: 1,
    type: "music",
    data: {
      title: "Music you might enjoy",
      description: "Based on your preferences",
      items: [
        {
          id: "m1",
          name: "Bohemian Rhapsody",
          type: "song",
          details: {
            artist: "Queen",
            genre: "Rock",
            description: "A six-minute epic that seamlessly transitions between ballad and operatic rock.",
            imageUrl: "https://images.unsplash.com/photo-1541704328070-34f7f9034376?q=80&w=1965&auto=format&fit=crop",
          },
        },
        {
          id: "m2",
          name: "Billie Jean",
          type: "song",
          details: {
            artist: "Michael Jackson",
            genre: "Pop",
            description: "A dance-funk track with a signature bassline that defined 80s pop music.",
            imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop",
          },
        },
        {
          id: "m3",
          name: "Smells Like Teen Spirit",
          type: "song",
          details: {
            artist: "Nirvana",
            genre: "Grunge",
            description: "The breakthrough hit that brought grunge music into the mainstream.",
            imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=2070&auto=format&fit=crop",
          },
        },
        {
          id: "m4",
          name: "Hey Jude",
          type: "song",
          details: {
            artist: "The Beatles",
            genre: "Rock",
            description: "An epic ballad with one of the most famous singalong endings in music history.",
            imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
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
    id: 2,
    user_id: 1,
    type: "film",
    data: {
      title: "Films you might enjoy",
      description: "Based on your preferences",
      items: [
        {
          id: "f1",
          name: "The Shawshank Redemption",
          type: "movie",
          details: {
            director: "Frank Darabont",
            genre: "Drama",
            description:
              "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
            imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop",
          },
        },
        {
          id: "f2",
          name: "The Godfather",
          type: "movie",
          details: {
            director: "Francis Ford Coppola",
            genre: "Crime",
            description:
              "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
            imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop",
          },
        },
        {
          id: "f3",
          name: "Pulp Fiction",
          type: "movie",
          details: {
            director: "Quentin Tarantino",
            genre: "Crime",
            description:
              "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
            imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070&auto=format&fit=crop",
          },
        },
        {
          id: "f4",
          name: "The Dark Knight",
          type: "movie",
          details: {
            director: "Christopher Nolan",
            genre: "Action",
            description:
              "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            imageUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=1887&auto=format&fit=crop",
          },
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
];

// Mock user preferences
export const mockPreferences: UserPreferencesDTO = {
  music: {
    genres: ["Rock", "Pop", "Jazz", "Classical"],
    artists: ["Queen", "Michael Jackson", "The Beatles", "Miles Davis"],
  },
  film: {
    genres: ["Drama", "Action", "Sci-Fi", "Comedy"],
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Tom Hanks", "Meryl Streep"],
    screenwriter: "Quentin Tarantino",
  },
};
