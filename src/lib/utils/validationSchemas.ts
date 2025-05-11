import { z } from "zod";

/**
 * Schemat walidacyjny dla parametrów zapytania CreateRecommendationsCommand.
 */
export const createRecommendationsSchema = z.object({
  type: z.enum(["music", "film"], {
    required_error: "Typ rekomendacji jest wymagany",
    invalid_type_error: "Typ rekomendacji musi być 'music' lub 'film'",
  }),
  force_refresh: z.boolean({
    required_error: "Parametr force_refresh jest wymagany",
    invalid_type_error: "Parametr force_refresh musi być wartością logiczną (true/false)",
  }),
});

/**
 * Schemat walidacyjny dla parametru URL - ID użytkownika.
 */
export const userIdParamSchema = z.object({
  id: z
    .string({
      required_error: "ID użytkownika jest wymagane",
      invalid_type_error: "ID użytkownika musi być ciągiem znaków",
    })
    .uuid({
      message: "ID użytkownika musi być poprawnym UUID",
    }),
});

/**
 * Schemat walidacyjny dla aktualizacji profilu użytkownika (PATCH /users/{id}).
 */
export const updateUserSchema = z.object({
  nick: z
    .string()
    .min(2, "Nick musi mieć co najmniej 2 znaki")
    .max(20, "Nick może mieć maksymalnie 20 znaków")
    .regex(
      /^[A-Za-z0-9_!]+$/,
      "Nick może zawierać tylko litery, cyfry, znak podkreślenia i wykrzyknik"
    )
    .optional(),
});

/**
 * Schemat walidacyjny dla aktualizacji preferencji muzycznych (PATCH /users/{id}/preferences/music).
 */
export const updateMusicPreferencesSchema = z.object({
  genres: z.array(z.string()).optional(),
  artists: z.array(z.string()).optional(),
});

/**
 * Schemat walidacyjny dla aktualizacji preferencji filmowych (PATCH /users/{id}/preferences/film).
 */
export const updateFilmPreferencesSchema = z.object({
  genres: z.array(z.string()).optional(),
  director: z.string().nullable().optional(),
  cast: z.array(z.string()).optional(),
  screenwriter: z.string().nullable().optional(),
});
