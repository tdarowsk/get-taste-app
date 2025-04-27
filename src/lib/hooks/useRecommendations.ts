import { useQuery } from "@tanstack/react-query";
import type { RecommendationDTO } from "../../types";
import { mockRecommendations, mockFilmRecommendations } from "./mockData";

interface UseRecommendationsOptions {
  userId: number;
  type: "music" | "film";
  isNewUser?: boolean;
}

export function useRecommendations({ userId, type, isNewUser = false }: UseRecommendationsOptions) {
  return useQuery({
    queryKey: ["recommendations", userId, type, isNewUser],
    queryFn: async () => {
      try {
        const url = new URL(`/api/users/${userId}/recommendations`, window.location.origin);
        url.searchParams.append("type", type);

        if (isNewUser) {
          url.searchParams.append("is_new_user", "true");
        }

        const response = await fetch(url.toString());

        if (response.status === 404) {
          console.log(`API endpoint not found, using mock data for ${type} recommendations`);
          return type === "music" ? mockRecommendations : mockFilmRecommendations;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
        }

        return (await response.json()) as RecommendationDTO[];
      } catch (error) {
        console.error(`Error fetching ${type} recommendations:`, error);
        // Return mock data in case of any error
        return type === "music" ? mockRecommendations : mockFilmRecommendations;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
