import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FilmPreferencesPanel } from "./FilmPreferencesPanel";
import { ToastProvider } from "../ui";

interface PreferencesWrapperProps {
  userId: string;
}

export function PreferencesWrapper({ userId }: PreferencesWrapperProps) {
  // Create a QueryClient instance for React Query
  const [queryClient] = useState(() => {
    try {
      return new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // Return a basic query client if the detailed config fails
      return new QueryClient();
    }
  });

  // Wrap the component rendering in an error boundary
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <FilmPreferencesPanel userId={userId} />
        </ToastProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Error rendering Preferences:", error);
    return (
      <div className="bg-red-500 text-white p-4 rounded">
        Failed to load preferences. Please reload the page.
      </div>
    );
  }
}
