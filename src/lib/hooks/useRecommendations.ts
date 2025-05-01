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
      const url = new URL(`/api/users/${userId}/recommendation-history`, window.location.origin);
      url.searchParams.append("feedback_type", "like");
      url.searchParams.append("type", type);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch liked recommendations: ${response.statusText}`);
      }
      const data = (await response.json()) as RecommendationHistoryDTO;
      // Extract the recommendation objects from history
      return data.data.map((h) => h.recommendation);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
