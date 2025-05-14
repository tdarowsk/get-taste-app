import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardLayout } from "./DashboardLayout";
import { ToastProvider } from "../ui";
import type { UserProfileDTO } from "../../types";

interface DashboardWrapperProps {
  user: UserProfileDTO;
  featureFlags?: {
    auth?: boolean;
    collections?: boolean;
    recommendations?: boolean;
    adaptiveRecommendations?: boolean;
    historyRecommendations?: boolean;
  };
}

// Create a default user for development/error cases
const defaultUser: UserProfileDTO = {
  id: "default-user",
  email: "user@example.com",
  nick: "Guest",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function DashboardWrapper({ user, featureFlags }: DashboardWrapperProps) {
  // Ensure we always have a valid user object, even if props fail
  const safeUser = user && user.id && user.id !== "undefined" ? user : defaultUser;

  // Create a client with safer initialization
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
    } catch (err) {
      console.error("Error initializing QueryClient:", err);
      // Return a basic query client if the detailed config fails
      return new QueryClient();
    }
  });

  // Wrap the component rendering in an error boundary
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <DashboardLayout user={safeUser} featureFlags={featureFlags} />
        </ToastProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Error rendering Dashboard:", error);
    return (
      <div className="bg-red-500 text-white p-4 rounded">
        Failed to load dashboard. Please reload the page.
      </div>
    );
  }
}
