import { useQuery } from "@tanstack/react-query";
import type { UserPreferencesDTO } from "../../types";

export function useUserPreferences(userId: string) {
  return useQuery<UserPreferencesDTO>({
    queryKey: ["userPreferences", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/preferences`);
      if (!response.ok) {
        throw new Error("Failed to fetch user preferences");
      }
      return response.json();
    },
  });
}
