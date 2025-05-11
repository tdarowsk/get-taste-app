import { useState, useRef, useEffect } from "react";
import { Card, useToast } from "../ui";
import type { RecommendationItemViewModel } from "../../lib/types/viewModels";
import { RecommendationDetail } from "./RecommendationDetail";
import type { RecommendationFeedbackType } from "../../types";
import { MovieMappingService } from "../../lib/services/movie-mapping.service";
import { extractPosterUrl, isValidImageUrl } from "../../lib/utils/poster-utils";
import { MoviePoster } from "../MoviePoster";

interface SwipeableRecommendationCardProps {
  item: RecommendationItemViewModel;
  type: "music" | "film";
  recommendationId: number;
  userId: string;
  onSwipe: (
    itemId: string,
    feedbackType: RecommendationFeedbackType,
    metadata: Record<string, unknown>
  ) => Promise<void>;
}

export function SwipeableRecommendationCard({
  item,
  type,
  onSwipe,
}: SwipeableRecommendationCardProps) {
  const { toast } = useToast();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [swipeState, setSwipeState] = useState<
    "none" | "swiping-left" | "swiping-right" | "swiped-left" | "swiped-right"
  >("none");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [movieTitle, setMovieTitle] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);

  // Define placeholder image based on type
  const placeholderImage =
    type === "music"
      ? "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop";

  // Get image URL with enhanced poster handling
  const rawImageUrl =
    extractPosterUrl(item.metadata || {}, type) ||
    item.imageUrl ||
    (item.metadata && "imageUrl" in item.metadata ? String(item.metadata.imageUrl) : null) ||
    (item.metadata && "poster_path" in item.metadata
      ? `https://image.tmdb.org/t/p/w500${item.metadata.poster_path}`
      : null) ||
    (item.metadata && "poster" in item.metadata ? String(item.metadata.poster) : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "imageUrl" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).imageUrl)
      : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "img" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).img)
      : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "poster" in (item.metadata.details as Record<string, unknown>)
      ? String((item.metadata.details as Record<string, unknown>).poster)
      : null) ||
    (item.metadata &&
    item.metadata.details &&
    typeof item.metadata.details === "object" &&
    "poster_path" in (item.metadata.details as Record<string, unknown>)
      ? `https://image.tmdb.org/t/p/w500${(item.metadata.details as Record<string, unknown>).poster_path}`
      : null) ||
    placeholderImage;

  // Validate the image URL before using it
  const imageUrl = isValidImageUrl(rawImageUrl as string) ? rawImageUrl : placeholderImage;

  // Extract genre safely
  const genre = (item.metadata.genre as string) || (type === "music" ? "Music" : "Film");

  // Function to safely get property from metadata
  const getMetadataValue = (key: string): string | null => {
    if (!item.metadata) return null;

    // Sprawdź bezpośrednio w metadanych - dane z AI będą najczęściej tutaj
    if (key in item.metadata) {
      const value = item.metadata[key];
      if (value) return String(value);
    }

    // Sprawdź w zagnieżdżonych detalach
    if (item.metadata.details && typeof item.metadata.details === "object") {
      const details = item.metadata.details as Record<string, unknown>;
      if (key in details) {
        const value = details[key];
        if (value) return String(value);
      }
    }

    // Check for arrays with the key name (like 'genres', 'cast', etc.)
    const pluralKey = key + "s"; // e.g., 'genre' -> 'genres'
    if (Array.isArray(item.metadata[pluralKey]) && item.metadata[pluralKey].length > 0) {
      // Join array elements if there are multiple values
      return Array.isArray(item.metadata[pluralKey])
        ? item.metadata[pluralKey].join(", ")
        : String(item.metadata[pluralKey][0]);
    }

    // Check for arrays with the key name in details
    if (item.metadata.details && typeof item.metadata.details === "object") {
      const details = item.metadata.details as Record<string, unknown>;
      if (Array.isArray(details[pluralKey]) && details[pluralKey].length > 0) {
        return Array.isArray(details[pluralKey])
          ? details[pluralKey].join(", ")
          : String(details[pluralKey][0]);
      }
    }

    // Specjalny przypadek dla klucza 'title' w danych z TMDB
    if (key === "title") {
      // Sprawdź bezpośrednio pole 'title' jeśli istnieje
      if (typeof item.metadata.title === "string") {
        return item.metadata.title;
      }

      // Sprawdź pole original_title
      if (typeof item.metadata.original_title === "string") {
        return item.metadata.original_title;
      }

      // Check name as a fallback
      if (typeof item.name === "string" && item.name !== "Unknown Movie") {
        return item.name;
      }
    }

    // Specjalny przypadek dla klucza 'year' z release_date z TMDB
    if (key === "year") {
      // Try direct year field
      if (item.metadata.year) {
        return String(item.metadata.year);
      }

      // Try release_date
      if ("release_date" in item.metadata) {
        const releaseDate = item.metadata.release_date as string;
        if (releaseDate && releaseDate.length >= 4) {
          return releaseDate.substring(0, 4);
        }
      }

      // Try details.releaseDate
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (
          details.releaseDate &&
          typeof details.releaseDate === "string" &&
          details.releaseDate.length >= 4
        ) {
          return details.releaseDate.substring(0, 4);
        }
      }

      // Return current year as last resort
      return new Date().getFullYear().toString();
    }

    // Specjalne sprawdzenie dla tablicy 'directors' jeśli szukamy 'director'
    if (key === "director") {
      // Sprawdź tablicę directors w metadanych
      if (Array.isArray(item.metadata.directors) && item.metadata.directors.length > 0) {
        return String(item.metadata.directors[0]);
      }

      // Sprawdź tablicę directors w details
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (Array.isArray(details.directors) && details.directors.length > 0) {
          return String(details.directors[0]);
        }
      }

      // Return "Unknown Director" as last resort for director
      return "Unknown Director";
    }

    // Special case for genre/genres
    if (key === "genre") {
      // Check genres array
      if (Array.isArray(item.metadata.genres) && item.metadata.genres.length > 0) {
        return item.metadata.genres.join(", ");
      }

      // Check details.genres array
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (Array.isArray(details.genres) && details.genres.length > 0) {
          return details.genres.join(", ");
        }
      }

      // Return default genre
      return type === "music" ? "Music" : "Drama";
    }

    // Special case for cast
    if (key === "cast") {
      // Check cast array
      if (Array.isArray(item.metadata.cast) && item.metadata.cast.length > 0) {
        return item.metadata.cast.slice(0, 3).join(", ");
      }

      // Check details.cast array
      if (item.metadata.details && typeof item.metadata.details === "object") {
        const details = item.metadata.details as Record<string, unknown>;
        if (Array.isArray(details.cast) && details.cast.length > 0) {
          return details.cast.slice(0, 3).join(", ");
        }
      }

      return type === "film" ? "Unknown Cast" : null;
    }

    return null;
  };

  // Sprawdź bezpośrednio wartości dla debugowania
  useEffect(() => {
    if (type === "film") {
      // Log all available metadata for debugging in color
      console.log(
        "%c 🎬 AI RECOMMENDATION DATA",
        "color: #00ff00; font-weight: bold; font-size: 16px; background-color: #333;"
      );
      console.log("%c Movie Details:", "color: #00ff00; font-weight: bold", {
        id: item.id,
        name: item.name || "No name",
        title: item.metadata?.title || "No title",
        metadata_title: getMetadataValue("title"),
        director: getMetadataValue("director") || "No director",
        year: getMetadataValue("year") || "No year",
        cast: getMetadataValue("cast") || "No cast",
        genre: getMetadataValue("genre") || "No genre",
        imageUrl: rawImageUrl || "No image",
        poster_path: item.metadata?.poster_path || "No poster path",
        description: item.metadata?.description || item.description || "No description",
      });

      // Log complete raw metadata structure
      console.log("%c Full Raw Metadata:", "color: #00ff00; font-weight: bold", item.metadata);

      // Log detailed nested item structure
      console.log("%c Complete Item Structure:", "color: #00ff00; font-weight: bold", {
        ...item,
        _imageFound: !!rawImageUrl && rawImageUrl !== placeholderImage,
        _metadataKeys: item.metadata ? Object.keys(item.metadata) : [],
        _hasDetailsObject: !!(item.metadata && item.metadata.details),
        _detailsKeys:
          item.metadata && item.metadata.details ? Object.keys(item.metadata.details) : [],
      });
    }
  }, [item.id, type, item.name]);

  // Effect to fetch movie title when needed
  useEffect(() => {
    // If this is a film, check for title in metadata or fetch it
    if (type === "film") {
      // Sprawdź bezpośrednio pole title w metadanych
      if (typeof item.metadata?.title === "string") {
        setMovieTitle(item.metadata.title);
        return;
      }

      // Try to get title using getMetadataValue helper
      const metadataTitle = getMetadataValue("title");
      if (metadataTitle) {
        setMovieTitle(metadataTitle);
        return;
      }

      // If no name or an "Unknown" name, try to fetch from TMDB
      if (!item.name || item.name === "Unknown Movie") {
        fetchMovieTitleFromTmdb();
      }
    }
  }, [item.id, type, item.name]);

  // Extract TMDB ID from item ID if available
  const extractTmdbId = (): string | null => {
    if (!item.id) return null;
    return MovieMappingService.extractTmdbId(item.id);
  };

  // Function to fetch movie title from TMDB API when missing
  const fetchMovieTitleFromTmdb = async () => {
    const tmdbId = extractTmdbId();
    if (!tmdbId) return;

    try {
      setIsLoadingTitle(true);

      // Try to fetch the movie details first
      const detailsResponse = await fetch(`/api/tmdb/movie/${tmdbId}`);

      if (detailsResponse.ok) {
        const movieData = await detailsResponse.json();
        if (movieData.title) {
          setMovieTitle(movieData.title);
          return;
        }
      }

      // If details don't have title, try to find similar movies
      const similarResponse = await fetch(`/api/tmdb/movie/similar?id=${tmdbId}&page=1`);

      if (similarResponse.ok) {
        const data = await similarResponse.json();
        if (data.results && data.results.length > 0) {
          // Use the first similar movie's title if available
          setMovieTitle(data.results[0].title);
        }
      }
    } catch (error) {
      console.error("Error fetching movie title:", error);
    } finally {
      setIsLoadingTitle(false);
    }
  };

  // Get artist and director safely
  const artist = getMetadataValue("artist");
  const director = getMetadataValue("director");

  // Determine display name with fallback - pokazuj tytuł z każdego możliwego źródła
  const displayName =
    movieTitle ||
    (typeof item.metadata?.title === "string" ? item.metadata.title : null) ||
    getMetadataValue("title") ||
    item.name ||
    (type === "music" ? "Unknown Track" : "Unknown Movie");

  // Log type and displayName before render
  console.log("[SwipeableRecommendationCard] type:", type, "displayName:", displayName);

  // Apply different accent colors based on type
  const accentColor =
    type === "music" ? "from-blue-600 to-indigo-600" : "from-purple-600 to-pink-600";

  // Handle card click to open detail view
  const handleCardClick = () => {
    // Only open details if not swiping
    if (!isDraggingRef.current) {
      setIsDetailOpen(true);
    }
  };

  // Handle close detail view
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  // Handle mouse/touch down event
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDetailOpen) return;

    e.preventDefault();
    isDraggingRef.current = true;

    // Get start position
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    startPosRef.current = { x: clientX, y: clientY };

    // Add event listeners for drag and end
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("touchmove", handleDragMove, { passive: false });
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchend", handleDragEnd);
  };

  // Handle mouse/touch move event
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();

    // Get current position
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    // Calculate delta
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    // Update position
    setPosition({ x: deltaX, y: deltaY });

    // Determine swipe direction based on position
    if (deltaX > 50) {
      setSwipeState("swiping-right");
    } else if (deltaX < -50) {
      setSwipeState("swiping-left");
    } else {
      setSwipeState("none");
    }
  };

  // Handle mouse/touch up event
  const handleDragEnd = async (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();
    isDraggingRef.current = false;

    // Remove event listeners
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchend", handleDragEnd);

    // Check if swipe was far enough to register
    if (position.x > 100) {
      // Swipe right (like)
      setSwipeState("swiped-right");

      // Trigger algorithm feedback
      await handleSwipeFeedback("like");
    } else if (position.x < -100) {
      // Swipe left (dislike)
      setSwipeState("swiped-left");

      // Trigger algorithm feedback
      await handleSwipeFeedback("dislike");
    } else {
      // Reset position if swipe wasn't far enough
      setPosition({ x: 0, y: 0 });
      setSwipeState("none");
    }
  };

  // Handle swipe feedback and trigger parent callback
  const handleSwipeFeedback = async (feedbackType: RecommendationFeedbackType) => {
    try {
      toast({
        title: feedbackType === "like" ? "Added to your likes" : "Noted your dislike",
        description: "Your taste profile is being updated",
        variant: feedbackType === "like" ? "default" : "destructive",
      });

      // Pass feedback to parent component
      await onSwipe(item.id, feedbackType, item.metadata);
    } catch (error) {
      console.error("Failed to save feedback:", error);
      // Reset on error
      setPosition({ x: 0, y: 0 });
      setSwipeState("none");

      toast({
        title: "Error",
        description: "Failed to save your preference",
        variant: "destructive",
      });
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, []);

  // Determine styles based on swipe state
  const getCardStyles = () => {
    let transform = `translate(${position.x}px, ${position.y}px)`;
    let opacity = 1;

    // Add rotation based on x position
    if (swipeState.includes("swiping") || swipeState.includes("swiped")) {
      const rotation = position.x * 0.1; // Rotation increases with swipe distance
      transform += ` rotate(${rotation}deg)`;
    }

    // Handle swiped states
    if (swipeState === "swiped-left" || swipeState === "swiped-right") {
      opacity = 0;
      transform +=
        swipeState === "swiped-right"
          ? " translate(150%, 0) rotate(40deg)"
          : " translate(-150%, 0) rotate(-40deg)";
    }

    return {
      transform,
      opacity,
      transition: swipeState.includes("swiped") ? "transform 0.5s, opacity 0.5s" : undefined,
    };
  };

  // Determine feedback indicator styles
  const getFeedbackIndicatorStyles = () => {
    if (swipeState === "swiping-right") {
      return "absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold";
    } else if (swipeState === "swiping-left") {
      return "absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold";
    }
    return "hidden";
  };

  return (
    <>
      <Card
        ref={cardRef}
        data-testid="swipe-card"
        className="overflow-hidden transition-all duration-300 h-full flex flex-col group bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-lg rounded-lg cursor-pointer select-none"
        onClick={handleCardClick}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={getCardStyles()}
      >
        {/* Feedback indicator */}
        <div className={getFeedbackIndicatorStyles()} data-testid="feedback-indicator">
          {swipeState === "swiping-right" && "LIKE"}
          {swipeState === "swiping-left" && "NOPE"}
        </div>

        <div className="flex p-3">
          {/* Thumbnail image */}
          <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-md mr-3 border border-white/10">
            {type === "film" ? (
              <MoviePoster title={displayName} size="sm" />
            ) : (
              <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Title and metadata */}
          <div className="flex-1 min-w-0">
            <div
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${accentColor} text-white mb-1`}
            >
              {genre}
            </div>
            <h3 className="text-xs font-bold line-clamp-1 text-white">{displayName}</h3>
            {type === "music" && artist && (
              <p className="text-[10px] text-gray-300 line-clamp-1">{artist}</p>
            )}
            {type === "film" && director && (
              <p className="text-[10px] text-gray-300 line-clamp-1">Dir: {director}</p>
            )}
          </div>
        </div>

        {item.description && (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-gray-300 line-clamp-2">{item.description}</p>
          </div>
        )}

        {/* Movie Details Section */}
        {type === "film" && (
          <div className="px-3 py-2 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">
              {isLoadingTitle ? (
                <span className="text-sm text-white opacity-70 italic">Loading movie info...</span>
              ) : typeof item.metadata?.title === "string" ? (
                item.metadata.title
              ) : (
                displayName
              )}
            </h3>

            <p className="text-[10px] text-gray-300">
              <span className="font-semibold">Director:</span>{" "}
              {director || getMetadataValue("director") || "Unknown"}
            </p>
            <p className="text-[10px] text-gray-300">
              <span className="font-semibold">Genre:</span>{" "}
              {getMetadataValue("genre") || genre || "Drama"}
            </p>
            <p className="text-[10px] text-gray-300">
              <span className="font-semibold">Year:</span>{" "}
              {getMetadataValue("year") ||
                getMetadataValue("release_date") ||
                new Date().getFullYear()}
            </p>
            <p className="text-[10px] text-gray-300">
              <span className="font-semibold">Cast:</span>{" "}
              {getMetadataValue("cast") || "Unknown cast"}
            </p>
            {getMetadataValue("runtime") && (
              <p className="text-[10px] text-gray-300">
                <span className="font-semibold">Runtime:</span> {getMetadataValue("runtime")} min
              </p>
            )}
          </div>
        )}

        <div className="mt-auto px-3 pb-3 pt-2 border-t border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            Swipe right to like, left to dislike
          </span>
          <div className="flex gap-2">
            <button
              data-testid="button-dislike"
              className="p-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleSwipeFeedback("dislike");
                setSwipeState("swiped-left");
              }}
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              data-testid="button-like"
              className="p-1.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleSwipeFeedback("like");
                setSwipeState("swiped-right");
              }}
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Detail View */}
      {isDetailOpen && <RecommendationDetail item={item} type={type} onClose={handleCloseDetail} />}
    </>
  );
}
