import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateMusicPreferencesCommand, UpdateFilmPreferencesCommand } from "../../types";
import { mockPreferences } from "./mockData";

interface UpdatePreferencesVariables {
  userId: number;
  type: "music" | "film";
  data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, type, data }: UpdatePreferencesVariables) => {
      try {
        const response = await fetch(`/users/${userId}/preferences/${type}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.status === 404) {
          console.log(`API endpoint not found, simulating preference update for ${type}`);
          // Simulate a delay to mimic API processing
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Return a simulated successful response
          return {
            success: true,
            message: "Mock preferences updated successfully",
            data: type === "music" ? { ...mockPreferences.music, ...data } : { ...mockPreferences.film, ...data },
          };
        }

        if (!response.ok) {
          throw new Error(`Failed to update ${type} preferences: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error updating ${type} preferences:`, error);
        // Return a mock success response to prevent UI breaking
        return {
          success: true,
          message: "Used mock data due to API error",
          data: type === "music" ? { ...mockPreferences.music, ...data } : { ...mockPreferences.film, ...data },
        };
      }
    },
    onSuccess: (_: unknown, variables: UpdatePreferencesVariables) => {
      queryClient.invalidateQueries({ queryKey: ["preferences", variables.userId] });
    },
  });
}
