import { useQuery } from "@tanstack/react-query";
import type { UserPreferencesDTO } from "../../types";
import { mockPreferences } from "./mockData";

export function useUserPreferences(userId: number) {
  return useQuery({
    queryKey: ["preferences", userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/users/${userId}/preferences`);

        if (response.status === 404) {
          console.log("API endpoint not found, using mock preference data");
          return mockPreferences;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch preferences: ${response.statusText}`);
        }

        return (await response.json()) as UserPreferencesDTO;
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        // Return mock data in case of any error
        return mockPreferences;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
