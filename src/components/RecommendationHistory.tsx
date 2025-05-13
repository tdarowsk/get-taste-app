import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RecommendationItem } from "../types";

interface RecommendationHistoryProps {
  userId: string;
  onRetry?: () => void;
}

export const RecommendationHistory = ({ userId, onRetry }: RecommendationHistoryProps) => {
  const [loading, setLoading] = useState(true);
  const [musicHistory, setMusicHistory] = useState<RecommendationItem[]>([]);
  const [filmHistory, setFilmHistory] = useState<RecommendationItem[]>([]);
  const [selectedTab, setSelectedTab] = useState("liked");
  const [contentType, setContentType] = useState<"music" | "film">("music");
  const [error, setError] = useState<string | null>(null);

  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Wykonaj żądanie API, aby pobrać historię rekomendacji
      const response = await fetch(
        `/api/recommendations/history?userId=${userId}&type=${contentType}&feedback=${selectedTab}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas pobierania historii");
      }

      const data = await response.json();

      if (contentType === "music") {
        setMusicHistory(data);
      } else {
        setFilmHistory(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [userId, selectedTab, contentType]);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const handleContentTypeChange = (value: "music" | "film") => {
    setContentType(value);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={loadHistoryData}>Spróbuj ponownie</Button>
        </div>
      );
    }

    const items = contentType === "music" ? musicHistory : filmHistory;

    if (!items.length) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500 mb-4">
            {selectedTab === "liked"
              ? `Nie masz jeszcze polubionych ${contentType === "music" ? "utworów" : "filmów"}.`
              : `Nie masz jeszcze ${contentType === "music" ? "utworów" : "filmów"} oznaczonych jako nielubiane.`}
          </p>
          {onRetry && (
            <Button onClick={onRetry}>
              Odkryj więcej {contentType === "music" ? "muzyki" : "filmów"}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="w-full">
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.type}</CardDescription>
            </CardHeader>
            <CardContent>{item.explanation && <p>{item.explanation}</p>}</CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Historia rekomendacji</h2>

        <div className="flex space-x-2">
          <Button
            variant={contentType === "music" ? "default" : "outline"}
            onClick={() => handleContentTypeChange("music")}
            size="sm"
          >
            Muzyka
          </Button>
          <Button
            variant={contentType === "film" ? "default" : "outline"}
            onClick={() => handleContentTypeChange("film")}
            size="sm"
          >
            Filmy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="liked" value={selectedTab} onValueChange={handleTabChange}>
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="liked">Lubiane</TabsTrigger>
            <TabsTrigger value="disliked">Nielubiane</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="liked" className="mt-0">
          {renderContent()}
        </TabsContent>
        <TabsContent value="disliked" className="mt-0">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
