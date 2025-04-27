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
    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-t-lg p-5 border-b border-white/10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            Your Recommendations
          </h2>
          <p className="text-gray-300 text-sm max-w-xl">Personalized suggestions based on your preferences</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={activeType}
            onValueChange={(value: string) => onTypeChange(value as "music" | "film")}
            className="bg-black/20 rounded-lg p-1 shadow-md border border-white/10"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger
                value="music"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white flex items-center gap-2 text-sm"
              >
                <Music2 className="h-3.5 w-3.5" />
                <span>Music</span>
              </TabsTrigger>
              <TabsTrigger
                value="film"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white flex items-center gap-2 text-sm"
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
            className="h-9 w-9 bg-black/20 shadow-md border border-white/10 text-white/90 hover:bg-black/40"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
