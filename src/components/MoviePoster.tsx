import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MoviePosterProps {
  title: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "grid";
}

const sizeClasses = {
  sm: "w-32 h-48",
  md: "w-48 h-72",
  lg: "w-64 h-96",
  grid: "w-36 h-54",
};

export function MoviePoster({ title, className, size = "md" }: MoviePosterProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!title) return;
    setIsLoading(true);
    fetch(`/api/tmdb/poster?title=${encodeURIComponent(title)}`)
      .then((res) => res.json())
      .then((data) => setImageUrl(data.posterUrl))
      .finally(() => setIsLoading(false));
  }, [title]);

  if (isLoading) {
    return <Skeleton className={cn("rounded-lg bg-muted", sizeClasses[size], className)} />;
  }

  if (!imageUrl) {
    return (
      <div
        className={cn(
          "rounded-lg bg-muted flex items-center justify-center text-muted-foreground",
          sizeClasses[size],
          className
        )}
      >
        <span className="text-sm">No poster available</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`Poster for ${title}`}
      className={cn("rounded-lg object-cover", sizeClasses[size], className)}
    />
  );
}
