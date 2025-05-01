import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateMusicPreferencesCommand, UpdateFilmPreferencesCommand } from "../../types";

interface UpdatePreferencesParams {
  userId: string;
  type: "music" | "film";
  data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, type, data }: UpdatePreferencesParams) => {
      const response = await fetch(`/api/users/${userId}/preferences/${type}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      return response.json();
    },
    onSuccess: (_, { userId }) => {
      // Invalidate user preferences query
      queryClient.invalidateQueries({ queryKey: ["userPreferences", userId] });
    },
  });
}
