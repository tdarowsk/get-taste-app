import { useQuery } from "@tanstack/react-query";
import type { RecommendationDTO, RecommendationHistoryDTO } from "../../types";

interface UseRecommendationsOptions {
  userId: string;
  type: "music" | "film";
  isNewUser?: boolean;
}

export function useRecommendations({ userId, type }: UseRecommendationsOptions) {
  return useQuery<RecommendationDTO[]>({
    queryKey: ["likedRecommendations", userId, type],
    queryFn: async () => {
      try {
        const url = new URL(`/api/users/${userId}/recommendation-history`, window.location.origin);
        url.searchParams.append("feedback_type", "like");
        url.searchParams.append("type", type);

        const response = await fetch(url.toString());
        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            `Failed to fetch liked recommendations: ${response.statusText}. Details: ${errorText}`
          );
        }

        const data = (await response.json()) as RecommendationHistoryDTO;

        // Check if data exists and has the expected structure
        if (!data || !data.data || !Array.isArray(data.data)) {
          return [];
        }

        // Extract the recommendation objects from history
        const recommendations = data.data.map((h) => h.recommendation);

        return recommendations;
      } catch {
        // Error caught and ignored
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
