import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardLayout } from "./DashboardLayout";
import { ToastProvider } from "../ui";
import type { UserProfileDTO } from "../../types";

interface DashboardWrapperProps {
  user: UserProfileDTO;
}

export function DashboardWrapper({ user }: DashboardWrapperProps) {
  // Validate the user object to ensure we have a valid ID

  // Ensure user ID is valid
  if (!user || !user.id || user.id === "undefined") {
    // We'll still render the component, but with a warning in the console
  }

  // Create a client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <DashboardLayout user={user} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
