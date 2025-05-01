import type { UserPreferencesDTO } from "../../types";

// Mock preferences data for when the API returns no results or for testing
export const mockPreferences: UserPreferencesDTO = {
  music: {
    genres: ["pop", "rock", "indie", "electronic"],
    artists: ["The Beatles", "Radiohead", "Daft Punk"],
  },
  film: {
    genres: ["action", "drama", "sci-fi", "comedy"],
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Tom Hardy", "Emma Stone"],
    screenwriter: "Jonathan Nolan",
  },
};
