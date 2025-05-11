import type {
  RecommendationDTO,
  RecommendationItem,
  MusicPreferencesDTO,
  FilmPreferencesDTO,
} from "../../types";
import type {
  RecommendationViewModel,
  RecommendationItemViewModel,
  MusicPreferencesFormModel,
  FilmPreferencesFormModel,
} from "../types/viewModels";
import { fetchMovieDetailsWithCache } from "./omdbApi";

// Define a more flexible type for the RecommendationDataDetails
interface ExtendedRecommendationData {
  title?: string;
  description?: string;
  items?: unknown[];
  recommendations?: unknown[];
  results?: unknown[];
  data?: ExtendedRecommendationData;
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  [key: string]: unknown;
}

/**
 * Transforms a RecommendationDTO to a RecommendationViewModel
 */
export async function transformRecommendationToViewModel(
  dto: RecommendationDTO
): Promise<RecommendationViewModel> {
  try {
    // Handle case where dto.data might be undefined or null
    if (!dto.data) {
      return {
        id: dto.id,
        type: dto.type,
        title: "Recommendation",
        items: [],
        createdAt: new Date(dto.created_at || new Date().toISOString()),
      };
    }

    // Cast to extended type for more flexible property access
    const extendedData = dto.data as unknown as ExtendedRecommendationData;

    // Log the raw data structure to understand what we're working with

    // Create transformed items array
    let transformedItems: RecommendationItemViewModel[] = [];

    // Try to extract items from different possible locations in the data structure
    try {
      // First try the standard items property
      if (
        extendedData.items &&
        Array.isArray(extendedData.items) &&
        extendedData.items.length > 0
      ) {
        transformedItems = await transformItemsArray(extendedData.items, dto.id);
      }
      // Next try if items is an object that can be converted to array
      else if (
        extendedData.items &&
        typeof extendedData.items === "object" &&
        !Array.isArray(extendedData.items)
      ) {
        const itemsArray = Object.values(extendedData.items);
        if (itemsArray.length > 0) {
          transformedItems = await transformItemsArray(itemsArray, dto.id);
        }
      }
      // Check for a recommendations property which might be used by OpenRouter
      else if (
        extendedData.recommendations &&
        Array.isArray(extendedData.recommendations) &&
        extendedData.recommendations.length > 0
      ) {
        transformedItems = await transformItemsArray(extendedData.recommendations, dto.id);
      }
      // Check for a results property
      else if (
        extendedData.results &&
        Array.isArray(extendedData.results) &&
        extendedData.results.length > 0
      ) {
        transformedItems = await transformItemsArray(extendedData.results, dto.id);
      }
      // Check for data.data nested structure (sometimes OpenRouter returns this)
      else if (extendedData.data && typeof extendedData.data === "object") {
        // Check for items in the nested data structure
        if (extendedData.data.items && Array.isArray(extendedData.data.items)) {
          transformedItems = await transformItemsArray(extendedData.data.items, dto.id);
        }
        // Check for recommendations in the nested data structure
        else if (
          extendedData.data.recommendations &&
          Array.isArray(extendedData.data.recommendations)
        ) {
          transformedItems = await transformItemsArray(extendedData.data.recommendations, dto.id);
        }
      }
      // Check for choices property (another OpenRouter format)
      else if (extendedData.choices && Array.isArray(extendedData.choices)) {
        // Try to find a message with content that could be parsed as JSON
        for (const choice of extendedData.choices) {
          if (choice.message && choice.message.content) {
            try {
              const content = JSON.parse(choice.message.content);
              if (content.items && Array.isArray(content.items)) {
                transformedItems = await transformItemsArray(content.items, dto.id);
                break;
              }
            } catch (parseError) {
              // Continue to next choice
            }
          }
        }
      }

      // If we still have no items, look for any array in the data that might contain recommendations
      if (transformedItems.length === 0) {
        // Look through all properties for arrays
        for (const [key, value] of Object.entries(extendedData)) {
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
            const potentialItems = await transformItemsArray(value, dto.id);
            if (potentialItems.length > 0) {
              transformedItems = potentialItems;
              break;
            }
          }
        }
      }

      // Log the count of items after all attempts

      if (transformedItems.length > 0) {
      } else {
      }
    } catch (error) {}

    // Return the transformed view model
    return {
      id: dto.id,
      type: dto.type,
      title: extendedData.title || `${dto.type === "music" ? "Music" : "Film"} Recommendations`,
      items: transformedItems,
      createdAt: new Date(dto.created_at || new Date().toISOString()),
    };
  } catch (error) {
    // Return a minimal valid structure in case of error
    return {
      id: dto.id,
      type: dto.type,
      title: `${dto.type === "music" ? "Music" : "Film"} Recommendations`,
      items: [],
      createdAt: new Date(dto.created_at || new Date().toISOString()),
    };
  }
}

/**
 * Helper function to transform an array of items from any source format to RecommendationItemViewModel[]
 */
async function transformItemsArray(
  items: unknown[],
  dtoId: number
): Promise<RecommendationItemViewModel[]> {
  // Process items one by one, but we'll await all OMDB API requests in parallel
  const transformPromises = items.map(async (item: unknown, index: number) => {
    if (!item || typeof item !== "object") {
      return null;
    }

    // Safe property access on unknown object
    const itemObj = item as Record<string, unknown>;

    // Extract ID with fallback
    const id = String(itemObj.id || `item-${dtoId}-${index}`);

    // Extract name with fallbacks
    const name = String(itemObj.name || itemObj.title || `Item ${index + 1}`);

    // Extract description with fallbacks
    const description = String(
      itemObj.description ||
        itemObj.explanation ||
        (itemObj.details &&
          typeof itemObj.details === "object" &&
          (itemObj.details as Record<string, unknown>).description) ||
        ""
    );

    // Build a metadata object from properties
    const metadata: Record<string, unknown> = {};

    // If item has details, copy all properties from it
    if (itemObj.details && typeof itemObj.details === "object") {
      Object.assign(metadata, itemObj.details);
    }

    // Copy relevant properties to metadata
    const propertiesToCopy = [
      "genre",
      "genres",
      "artist",
      "director",
      "year",
      "cast",
      "confidence",
      "type",
      "release_date",
      "vote_average",
      "explanation",
    ];

    propertiesToCopy.forEach((prop) => {
      if (prop in itemObj && !metadata[prop]) {
        metadata[prop] = itemObj[prop];
      }
    });

    // Add description to metadata if not already there
    if (!metadata.description && description) {
      metadata.description = description;
    }

    // IMPROVED: Extract image URL with expanded fallbacks
    let imageUrl: string | undefined;

    // Sprawdź czy mamy dane o plakacie bezpośrednio z AI
    if (typeof itemObj.posterUrl === "string") {
      imageUrl = itemObj.posterUrl;
    }
    // Direct image URL on the item
    else if (typeof itemObj.imageUrl === "string") {
      imageUrl = itemObj.imageUrl;
    }
    // Image URL in details object
    else if (
      itemObj.details &&
      typeof itemObj.details === "object" &&
      typeof (itemObj.details as Record<string, unknown>).imageUrl === "string"
    ) {
      imageUrl = (itemObj.details as Record<string, unknown>).imageUrl as string;
    }
    // Sprawdź posterPath z AI
    else if (typeof itemObj.posterPath === "string") {
      if (itemObj.posterPath.startsWith("http")) {
        imageUrl = itemObj.posterPath;
      } else {
        // Zakładając, że to relatywna ścieżka z TMDB
        imageUrl = `https://image.tmdb.org/t/p/w500${itemObj.posterPath}`;
      }
    }
    // TMDB poster_path - either at root or in details
    else if (typeof itemObj.poster_path === "string") {
      imageUrl = `https://image.tmdb.org/t/p/w500${itemObj.poster_path}`;
    } else if (
      itemObj.details &&
      typeof itemObj.details === "object" &&
      typeof (itemObj.details as Record<string, unknown>).poster_path === "string"
    ) {
      imageUrl = `https://image.tmdb.org/t/p/w500${(itemObj.details as Record<string, unknown>).poster_path as string}`;
    }
    // Image property
    else if (typeof itemObj.image === "string") {
      imageUrl = itemObj.image as string;
    }
    // Image in nested properties - check Claude's response format
    else if (
      itemObj.details &&
      typeof itemObj.details === "object" &&
      typeof (itemObj.details as Record<string, unknown>).image === "string"
    ) {
      imageUrl = (itemObj.details as Record<string, unknown>).image as string;
    }
    // Sprawdź alternatywne nazwy pól, które model AI może używać dla plakatów
    else if (typeof itemObj.poster === "string") {
      imageUrl = itemObj.poster as string;
    } else if (
      itemObj.details &&
      typeof itemObj.details === "object" &&
      typeof (itemObj.details as Record<string, unknown>).poster === "string"
    ) {
      imageUrl = (itemObj.details as Record<string, unknown>).poster as string;
    }

    // IMPROVED: Process director information with better fallbacks
    // If director isn't in metadata yet, check other possible locations
    if (!metadata.director) {
      // Check for director in the root object first (given our updated AI prompt)
      if (typeof itemObj.director === "string") {
        metadata.director = itemObj.director;
      }
      // Check for director in details.director
      else if (
        itemObj.details &&
        typeof itemObj.details === "object" &&
        typeof (itemObj.details as Record<string, unknown>).director === "string"
      ) {
        metadata.director = (itemObj.details as Record<string, unknown>).director;
      }
      // Look for directors array (some APIs provide this format)
      else if (Array.isArray(itemObj.directors) && itemObj.directors.length > 0) {
        metadata.director = itemObj.directors[0];
      } else if (
        itemObj.details &&
        typeof itemObj.details === "object" &&
        Array.isArray((itemObj.details as Record<string, unknown>).directors) &&
        ((itemObj.details as Record<string, unknown>).directors as unknown[]).length > 0
      ) {
        metadata.director = (
          (itemObj.details as Record<string, unknown>).directors as unknown[]
        )[0];
      } else {
      }
    } else {
    }

    // Check the metadata for cast if it doesn't exist and we have it
    if (!metadata.cast && Array.isArray(itemObj.cast)) {
      metadata.cast = itemObj.cast;
    }

    // Now try to enrich with OMDB API data if this looks like a film recommendation
    // and we're missing image or director
    const isFilmItem =
      String(dtoId).includes("film") ||
      (typeof itemObj.type === "string" && itemObj.type === "film") ||
      metadata.type === "film";

    if (isFilmItem && (!imageUrl || !metadata.director) && name) {
      // Log the current state of metadata to debug

      // Only fetch from OMDB if we're actually missing data
      const needsOmdbFetch = !imageUrl || !metadata.director;

      if (needsOmdbFetch) {
        try {
          // Fetch additional details from OMDB

          const omdbDetails = await fetchMovieDetailsWithCache(name);

          // If we got OMDB details, use them to fill in missing data
          if (omdbDetails) {
            // Fill in missing poster/image ONLY if it's not already provided by the AI
            if (!imageUrl && omdbDetails.poster) {
              imageUrl = omdbDetails.poster;
            } else if (imageUrl) {
            }

            // Fill in missing director ONLY if it's not already provided by the AI
            if (!metadata.director && omdbDetails.director) {
              metadata.director = omdbDetails.director;
            } else if (metadata.director) {
            }

            // Add year if available and not already set
            if (!metadata.year && omdbDetails.year) {
              metadata.year = omdbDetails.year;
            } else if (metadata.year) {
            }
          }
        } catch (error) {}
      } else {
      }
    }

    // Debug log for problematic items
    if (!imageUrl || !metadata.director) {
    }

    // Need to add a default type for the view model
    // We can infer the type from the DTO ID or just use a default
    // Most items will have their type set when used in a specific context like film recommendations
    const inferredType =
      typeof itemObj.type === "string"
        ? (itemObj.type as "music" | "film")
        : metadata && typeof metadata.type === "string"
          ? (metadata.type as "music" | "film")
          : dtoId.toString().includes("film")
            ? "film"
            : dtoId.toString().includes("music")
              ? "music"
              : "film"; // Default to film if we can't determine

    return {
      id,
      name,
      description,
      imageUrl,
      metadata,
      type: inferredType,
    };
  });

  // Wait for all promises to resolve and filter out any null results
  return Promise.all(transformPromises).then(
    (results) => results.filter(Boolean) as RecommendationItemViewModel[]
  );
}

/**
 * Transforms a RecommendationItem to a RecommendationItemViewModel
 */
export function transformRecommendationItemToViewModel(
  item: RecommendationItem
): RecommendationItemViewModel {
  // Add defensive checks
  if (!item) {
    return {
      id: `generated-${Date.now()}`,
      name: "Unknown Item",
      description: undefined,
      imageUrl: undefined,
      metadata: {},
      type: "film", // Add default type
    };
  }

  return {
    id: item.id || `generated-${Date.now()}`,
    name: item.name || "Unnamed Item",
    description: item.details?.description as string | undefined,
    imageUrl: item.details?.imageUrl as string | undefined,
    metadata: item.details || {},
    type: item.type as "music" | "film",
  };
}

/**
 * Transforms MusicPreferencesDTO to MusicPreferencesFormModel
 */
export function transformMusicPreferencesToFormModel(
  dto: MusicPreferencesDTO | undefined
): MusicPreferencesFormModel {
  return {
    genres: dto?.genres || [],
    artists: dto?.artists || [],
  };
}

/**
 * Transforms FilmPreferencesDTO to FilmPreferencesFormModel
 */
export function transformFilmPreferencesToFormModel(
  dto: FilmPreferencesDTO | undefined
): FilmPreferencesFormModel {
  return {
    genres: dto?.genres || [],
    director: dto?.director || "",
    cast: dto?.cast || [],
    screenwriter: dto?.screenwriter || "",
  };
}
