import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import FilmPreferences from "./FilmPreferences";
import { useToast } from "../ui";

interface PreferencesPanelProps {
  userId: string;
  onPreferencesUpdated?: () => void;
  isNewUser?: boolean;
  // Testing only props - not for production use
  _activeTabForTesting?: string;
  _setActiveTabForTesting?: (tab: string) => void;
}

export function PreferencesPanel({
  userId,
  onPreferencesUpdated,
  isNewUser = false,
  _activeTabForTesting,
  _setActiveTabForTesting,
}: PreferencesPanelProps) {
  // Use testing props if provided, otherwise use normal state
  const [activeTab, setActiveTab] = useState(_activeTabForTesting || "film");
  const [hasFilmPreferences, setHasFilmPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // If testing props change, update the local state
  useEffect(() => {
    if (_activeTabForTesting !== undefined) {
      setActiveTab(_activeTabForTesting);
    }
  }, [_activeTabForTesting]);

  // Use the testing setter or the local setter
  const handleTabChange = (tab: string) => {
    if (_setActiveTabForTesting) {
      _setActiveTabForTesting(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Fetch user preferences status when component mounts
  useEffect(() => {
    const checkPreferences = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/preferences`);

        if (response.ok) {
          const data = await response.json();

          // Check if film preferences are set
          const hasFilm =
            data.filmPreferences &&
            Array.isArray(data.filmPreferences.genres) &&
            data.filmPreferences.genres.length > 0;

          setHasFilmPreferences(hasFilm);
        }
      } catch {
        // Error checking preferences
      } finally {
        setIsLoading(false);
      }
    };

    checkPreferences();
  }, [userId]);

  // Handle preferences update
  const handlePreferencesChange = () => {
    // Update the status flag
    setHasFilmPreferences(true);

    // Notify parent component if needed
    if (onPreferencesUpdated) {
      onPreferencesUpdated();
    }
  };

  // Force generate recommendations
  const forceGenerateRecommendations = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/users/${userId}/recommendations?force=true`);

      if (response.ok) {
        toast({
          title: "Generating recommendations",
          description: "New recommendations are being generated based on your preferences.",
          variant: "default",
        });

        // Refresh the page after a delay to show new recommendations
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate recommendations.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-lg p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Your Preferences</h2>

        <Button
          onClick={forceGenerateRecommendations}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <svg
            className="w-4 h-4 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
          Generate Recommendations
        </Button>
      </div>

      <p className="text-gray-300 text-sm">
        Set your preferences to get better recommendations tailored to your taste.
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="film" className="data-[state=active]:bg-purple-600">
            Film
          </TabsTrigger>
          <TabsTrigger value="music" className="data-[state=active]:bg-blue-600">
            Music
          </TabsTrigger>
        </TabsList>

        <TabsContent value="film" className="mt-4">
          <FilmPreferences
            userId={userId}
            onPreferencesChange={handlePreferencesChange}
            isNewUser={isNewUser}
          />
        </TabsContent>

        <TabsContent value="music" className="mt-4">
          <div className="text-center py-8 text-gray-400">
            <p>Music preferences coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>

      {!isLoading && !hasFilmPreferences && activeTab === "film" && (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded p-3 text-amber-200 text-sm">
          <p>
            You haven&apos;t set any film preferences yet. Select your favorite genres to get
            personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
