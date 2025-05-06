import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { RecommendationItem } from "../types";
import type { RecommendationFormValues } from "../types/forms";

interface RecommendationCardProps {
  item: RecommendationItem;
  showActions?: boolean;
  isActive?: boolean;
}

export const RecommendationCard = ({
  item,
  showActions = true,
  isActive = true,
}: RecommendationCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setValue } = useFormContext<RecommendationFormValues>();

  const handleLike = async () => {
    if (!isActive) return;

    setIsLoading(true);
    try {
      setValue("feedback", { itemId: item.id, type: "like" }, { shouldDirty: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!isActive) return;

    setIsLoading(true);
    try {
      setValue("feedback", { itemId: item.id, type: "dislike" }, { shouldDirty: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Format item details for display
  const renderDetails = () => {
    if (!item.details) return null;

    const details = item.details as Record<string, unknown>;
    return (
      <div className="space-y-2">
        {/* Render genres as badges if available */}
        {details.genres && Array.isArray(details.genres) && details.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {details.genres.map((genre: string) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {/* Display other details */}
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {item.type === "film" && details.director && (
            <>
              <dt className="font-medium text-gray-500">Reżyser:</dt>
              <dd>{String(details.director)}</dd>
            </>
          )}
          {item.type === "film" && details.year && (
            <>
              <dt className="font-medium text-gray-500">Rok:</dt>
              <dd>{String(details.year)}</dd>
            </>
          )}
          {(item.type === "album" || item.type === "track") && details.artist && (
            <>
              <dt className="font-medium text-gray-500">Artysta:</dt>
              <dd>{String(details.artist)}</dd>
            </>
          )}
          {item.type === "track" && details.album && (
            <>
              <dt className="font-medium text-gray-500">Album:</dt>
              <dd>{String(details.album)}</dd>
            </>
          )}
          {(item.type === "album" || item.type === "track") && details.year && (
            <>
              <dt className="font-medium text-gray-500">Rok:</dt>
              <dd>{String(details.year)}</dd>
            </>
          )}
        </dl>

        {/* Display cast if available and it's a film */}
        {item.type === "film" &&
          details.cast &&
          Array.isArray(details.cast) &&
          details.cast.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Obsada:</h4>
              <p className="text-sm">
                {(details.cast as string[]).slice(0, 3).join(", ")}
                {(details.cast as string[]).length > 3 ? ", ..." : ""}
              </p>
            </div>
          )}

        {/* Show explanation if available */}
        {item.explanation && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-sm italic text-gray-600">{item.explanation}</p>
          </div>
        )}

        {/* Show confidence if available */}
        {item.confidence !== undefined && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-green-600 h-1.5 rounded-full"
              style={{ width: `${Math.round(item.confidence * 100)}%` }}
              title={`Pewność: ${Math.round(item.confidence * 100)}%`}
            ></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      className={`w-full shadow-md transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <CardDescription>
              {item.type === "album"
                ? "Album"
                : item.type === "track"
                  ? "Utwór"
                  : item.type === "artist"
                    ? "Artysta"
                    : "Film"}
            </CardDescription>
          </div>
          {item.confidence !== undefined && (
            <Badge variant="outline" className="ml-2">
              {Math.round(item.confidence * 100)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>{renderDetails()}</CardContent>
      {showActions && (
        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleDislike}
            disabled={isLoading || !isActive}
            className="w-full mr-2"
          >
            👎 Nie lubię
          </Button>
          <Button
            variant="default"
            onClick={handleLike}
            disabled={isLoading || !isActive}
            className="w-full"
          >
            👍 Lubię
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
