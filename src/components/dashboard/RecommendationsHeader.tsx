import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { RefreshCw, Music2, Film } from "lucide-react";

interface RecommendationsHeaderProps {
  activeType: "music" | "film";
  onTypeChange: (type: "music" | "film") => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function RecommendationsHeader({ activeType, onTypeChange, onRefresh, isLoading }: RecommendationsHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Your Recommendations
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl">Personalized suggestions based on your preferences</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={activeType}
            onValueChange={(value: string) => onTypeChange(value as "music" | "film")}
            className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger
                value="music"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white flex items-center gap-2 text-sm"
              >
                <Music2 className="h-3.5 w-3.5" />
                <span>Music</span>
              </TabsTrigger>
              <TabsTrigger
                value="film"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white flex items-center gap-2 text-sm"
              >
                <Film className="h-3.5 w-3.5" />
                <span>Film</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={onRefresh}
            variant="outline"
            size="icon"
            disabled={isLoading}
            className="h-9 w-9 bg-white dark:bg-gray-800 shadow-sm border"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
