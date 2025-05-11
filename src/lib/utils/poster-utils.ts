/**
 * Utility functions for handling movie poster URLs and fallbacks
 */

// TMDB poster URL constants
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const POSTER_SIZE_SMALL = "w300";
const POSTER_SIZE_MEDIUM = "w500";
const POSTER_SIZE_LARGE = "original";

/**
 * Generate a full TMDB poster URL from a poster path
 */
export function getTmdbPosterUrl(
  posterPath: string | null,
  size: "small" | "medium" | "large" = "medium"
): string | null {
  if (!posterPath) return null;

  // Make sure the poster path starts with a slash
  const path = posterPath.startsWith("/") ? posterPath : `/${posterPath}`;

  // Set size based on parameter
  const sizeParam =
    size === "small"
      ? POSTER_SIZE_SMALL
      : size === "large"
        ? POSTER_SIZE_LARGE
        : POSTER_SIZE_MEDIUM;

  return `${TMDB_IMAGE_BASE_URL}${sizeParam}${path}`;
}

/**
 * Get a fallback poster URL for when no poster is available
 */
export function getFallbackPosterUrl(title?: string, type: "film" | "music" = "film"): string {
  const encodedTitle = encodeURIComponent(title || (type === "film" ? "Movie" : "Music"));
  return `https://via.placeholder.com/500x750/222222/ffffff?text=${encodedTitle}`;
}

/**
 * Extract a valid poster URL from various possible formats in recommendation data
 */
export function extractPosterUrl(
  item: Record<string, unknown>,
  itemType: "film" | "music" = "film"
): string {
  // Try all possible poster URL locations in order of preference

  // 1. Check for poster_path in TMDB format and convert to full URL
  if (typeof item.poster_path === "string") {
    const tmdbUrl = getTmdbPosterUrl(item.poster_path);
    if (tmdbUrl) return tmdbUrl;
  }

  // 2. Check for img field from recommendations
  if (item.details && typeof item.details === "object") {
    const details = item.details as Record<string, unknown>;
    if (typeof details.img === "string") {
      return details.img as string;
    }
  }

  // 3. Check for direct imageUrl
  if (typeof item.imageUrl === "string") {
    return item.imageUrl as string;
  }

  // 4. Check for imageUrl in details
  if (item.details && typeof item.details === "object") {
    const details = item.details as Record<string, unknown>;
    if (typeof details.imageUrl === "string") {
      return details.imageUrl as string;
    }
  }

  // 5. Check for poster in details
  if (item.details && typeof item.details === "object") {
    const details = item.details as Record<string, unknown>;
    if (typeof details.poster === "string") {
      return details.poster as string;
    }
  }

  // 6. Get a title for the fallback if available
  const title =
    typeof item.title === "string"
      ? item.title
      : typeof item.name === "string"
        ? item.name
        : undefined;

  // 7. Return fallback URL
  return getFallbackPosterUrl(title, itemType);
}

/**
 * Check if a URL appears to be a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  return Boolean(
    url &&
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://")) &&
      (url.endsWith(".jpg") ||
        url.endsWith(".jpeg") ||
        url.endsWith(".png") ||
        url.endsWith(".webp") ||
        url.includes("image.tmdb.org") ||
        url.includes("placeholder.com"))
  );
}
