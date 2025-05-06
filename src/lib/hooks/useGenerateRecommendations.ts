import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GenerateRecommendationsVariables {
  userId: string;
  type: "music" | "film";
  force_refresh: boolean;
  is_new_user?: boolean;
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      type,
      force_refresh,
      is_new_user,
    }: GenerateRecommendationsVariables) => {
      try {
        const url = new URL(`/api/recommendations/generate`, window.location.origin);

        // Create timeout controller for the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn("[Frontend] Aborting recommendations request due to timeout");
          controller.abort();
        }, 60000); // 60 second timeout

        try {
          console.info(
            `[Frontend] Sending recommendation request for type: ${type}, force_refresh: ${force_refresh}`
          );

          const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            signal: controller.signal,
            body: JSON.stringify({
              userId,
              type,
              force_refresh,
              is_new_user: is_new_user || false,
              force_ai: true,
            }),
          });

          // Clear the timeout as the request completed
          clearTimeout(timeoutId);

          console.info(`[Frontend] Got response with status: ${response.status}`);

          if (response.status === 401) {
            throw new Error("Nieautoryzowany dostęp - wymagane zalogowanie");
          }

          if (response.status === 404) {
            throw new Error("Endpoint API nie został znaleziony");
          }

          if (!response.ok) {
            const errorText = await response.text();

            // Check if this is an OpenRouter API error (Forbidden)
            try {
              const errorObj = JSON.parse(errorText);
              if (
                errorObj &&
                errorObj.error &&
                ((errorObj.error.includes("OpenRouter") && errorObj.error.includes("403")) ||
                  (errorObj.error.includes("OpenRouter") && errorObj.error.includes("Forbidden")))
              ) {
                // Return error information to show in the UI
                console.warn("[Frontend] OpenRouter API error (likely rate limit)");
                throw new Error("OpenRouter API temporarily unavailable. Please try again later.");
              }
            } catch (jsonError) {
              // Continue with the normal error flow
              console.error("[Frontend] Error parsing error response:", jsonError);
            }

            throw new Error(
              `Failed to generate recommendations: ${response.statusText}. Details: ${errorText}`
            );
          }

          const data = await response.json();
          console.info(
            `[Frontend] Successfully received recommendations with ${data?.data?.items?.length || 0} items`
          );

          // Check if we got an empty response
          if (!data.data || !data.data.items || data.data.items.length === 0) {
            console.warn("[Frontend] Server returned empty items array");
            throw new Error(
              "No recommendations found. Please try again or update your preferences."
            );
          }

          // Invalidate the recommendations query to refresh data
          queryClient.invalidateQueries({
            queryKey: ["latestRecommendations"],
          });

          queryClient.invalidateQueries({
            queryKey: ["recommendations"],
          });

          return data;
        } catch (fetchError) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);

          // Handle abort errors specially
          if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
            console.error("[Frontend] Request timed out after 60 seconds");
            throw new Error("Request timed out after 60 seconds. Please try again later.");
          }

          throw fetchError;
        }
      } catch (error) {
        console.error("[Frontend] Error in generateRecommendations:", error);
        throw error; // Let the UI handle the error display
      }
    },
    onError: (error) => {
      console.error("[Frontend] Mutation error:", error);
    },
    onSuccess: () => {
      console.info("[Frontend] Mutation successful");
    },
  });
}
