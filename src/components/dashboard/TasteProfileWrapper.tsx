import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "../ui";
import type { UserTasteDTO } from "../../types";

interface TasteProfileWrapperProps {
  userId: string;
  initialData?: UserTasteDTO;
}

export function TasteProfileWrapper({ userId, initialData }: TasteProfileWrapperProps) {
  const [taste, setTaste] = useState<UserTasteDTO | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error("Error initializing QueryClient:", err);
      // Return a basic query client if the detailed config fails
      return new QueryClient();
    }
  });

  useEffect(() => {
    if (!initialData) {
      fetchTasteProfile();
    }
  }, [userId, initialData]);

  const fetchTasteProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/taste`);
      if (!response.ok) {
        throw new Error("Failed to fetch taste profile");
      }

      const data = await response.json();
      setTaste(data);
    } catch (err) {
      console.error("Error fetching taste profile:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  // Wrap the component rendering in an error boundary
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6 flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 flex items-center justify-center p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Go back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Your Taste Profile</h1>
                <p className="text-gray-400">
                  Discover insights about your music and film preferences
                </p>
              </div>
            </div>

            {loading && (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg p-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}

            {error && (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-red-500/30 shadow-lg p-8">
                <h3 className="text-xl font-bold text-red-400">Error Loading Taste Profile</h3>
                <p className="text-white/80 mt-2">{error}</p>
                <button
                  onClick={fetchTasteProfile}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && taste && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main profile card */}
                <div className="lg:col-span-12">
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{taste.name}</h2>
                    <p className="text-gray-300 mb-6">{taste.description}</p>

                    <div className="mt-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4 rounded-lg border border-purple-500/20">
                      <p className="text-white/80 text-sm italic">
                        Your taste profile is built based on your preferences and interactions with
                        recommendations. The more you engage, the more accurate your profile
                        becomes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Music analysis card */}
                {taste.music && (
                  <div className="lg:col-span-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-8 h-full">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-md mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Music Analysis</h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="w-28 text-gray-400 shrink-0">Genres:</div>
                          <div className="text-white flex-1 flex flex-wrap gap-1">
                            {taste.music.genres.map((genre, index) => (
                              <span
                                key={index}
                                className="bg-blue-900/30 px-2 py-1 rounded text-sm"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-28 text-gray-400 shrink-0">Mood:</div>
                          <div className="text-white flex-1 flex flex-wrap gap-1">
                            {taste.music.mood.map((mood, index) => (
                              <span
                                key={index}
                                className="bg-indigo-900/30 px-2 py-1 rounded text-sm"
                              >
                                {mood}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-28 text-gray-400">Style:</div>
                          <div className="text-white">{taste.music.style}</div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-28 text-gray-400">Intensity:</div>
                          <div className="w-full max-w-xs bg-gray-700/50 rounded-full h-2.5 flex-1">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                              style={{ width: `${(taste.music.intensity / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-white">{taste.music.intensity}/10</span>
                        </div>

                        <div className="flex items-center">
                          <div className="w-28 text-gray-400">Variety:</div>
                          <div className="w-full max-w-xs bg-gray-700/50 rounded-full h-2.5 flex-1">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full"
                              style={{ width: `${(taste.music.variety / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-white">{taste.music.variety}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Film analysis card */}
                {taste.film && (
                  <div className="lg:col-span-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 p-8 h-full">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-md mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 4v16M17 4v16M3 8h18M3 16h18"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Film Analysis</h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="w-28 text-gray-400 shrink-0">Genres:</div>
                          <div className="text-white flex-1 flex flex-wrap gap-1">
                            {taste.film.genres.map((genre, index) => (
                              <span
                                key={index}
                                className="bg-purple-900/30 px-2 py-1 rounded text-sm"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-28 text-gray-400 shrink-0">Mood:</div>
                          <div className="text-white flex-1 flex flex-wrap gap-1">
                            {taste.film.mood.map((mood, index) => (
                              <span
                                key={index}
                                className="bg-pink-900/30 px-2 py-1 rounded text-sm"
                              >
                                {mood}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-28 text-gray-400">Style:</div>
                          <div className="text-white">{taste.film.style}</div>
                        </div>

                        <div className="flex items-center">
                          <div className="w-28 text-gray-400">Intensity:</div>
                          <div className="w-full max-w-xs bg-gray-700/50 rounded-full h-2.5 flex-1">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
                              style={{ width: `${(taste.film.intensity / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-white">{taste.film.intensity}/10</span>
                        </div>

                        <div className="flex items-center">
                          <div className="w-28 text-gray-400">Variety:</div>
                          <div className="w-full max-w-xs bg-gray-700/50 rounded-full h-2.5 flex-1">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-rose-500 h-2.5 rounded-full"
                              style={{ width: `${(taste.film.variety / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-white">{taste.film.variety}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ToastProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Error rendering Taste Profile:", error);
    return (
      <div className="bg-red-500 text-white p-4 rounded">
        Failed to load taste profile. Please reload the page.
      </div>
    );
  }
}
