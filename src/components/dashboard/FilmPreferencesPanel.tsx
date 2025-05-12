import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilmPreferencesPanelProps {
  userId: string;
}

// Interface for genre items from API
interface GenreItem {
  id: string;
  name: string;
  type: string;
  count: number;
  weight: number;
}

// Type for API response - always an array
type ApiResponse = GenreItem[];

export function FilmPreferencesPanel({ userId }: FilmPreferencesPanelProps) {
  const [contentType, setContentType] = useState<"film" | "music">("film");
  const [debug, setDebug] = useState<string[]>([]);
  const [rawResponseData, setRawResponseData] = useState<string>("");
  const [isLoadingTestData, setIsLoadingTestData] = useState(false);
  // Use the provided userId
  const effectiveUserId = userId;

  // Function for logging in the application for debugging
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    const logMessage = `${timestamp} ${message}`;
    setDebug((prev) => [...prev.slice(-14), logMessage]); // Last 15 logs
    console.info(`[FilmPreferencesPanel] ${logMessage}`);
  }, []);

  // Fetch genre data from API
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["preferenceGenres", effectiveUserId, contentType],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      // Use window.location.origin for full URL
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const apiUrl = `${baseUrl}/api/user-preferences-genres?userId=${encodeURIComponent(effectiveUserId)}&type=${contentType}&t=${timestamp}`;

      addLog(`Fetching from database: ${apiUrl}`);

      try {
        // Add headers to avoid caching issues
        const response = await fetch(apiUrl, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        addLog(`API Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          addLog(`API Error: ${response.status} - ${errorText.substring(0, 100)}...`);
          throw new Error(`Failed to fetch preferences: ${response.statusText}`);
        }

        const responseText = await response.text();
        setRawResponseData(responseText);
        addLog(`API Response received (${responseText.length} bytes)`);

        try {
          const parsedData = JSON.parse(responseText);

          // Handle array response
          if (Array.isArray(parsedData)) {
            addLog(`Received array of ${parsedData.length} items from database`);
            parsedData.forEach((item, index) => {
              if (index < 3) {
                // Log only first 3 items
                addLog(
                  `Item ${index}: id=${item.id}, name=${item.name}, type=${item.type}, count=${item.count}`
                );
              }
            });
            return parsedData;
          }

          // If response is not an array, something is wrong
          addLog(`API returned incorrect data format: ${typeof parsedData}`);
          addLog(`Data preview: ${JSON.stringify(parsedData).substring(0, 100)}...`);
          throw new Error("API returned incorrect data format");
        } catch (parseError) {
          addLog(
            `JSON Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
          throw parseError;
        }
      } catch (fetchError) {
        addLog(
          `Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
        );
        throw fetchError;
      }
    },
    staleTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: true,
  });

  // Initial logging when component mounts
  useEffect(() => {
    addLog(`Component mounted with userId: ${effectiveUserId} (original: ${userId || "none"})`);
    addLog(`Initial contentType: ${contentType}`);

    // Log full API URL
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      addLog(`Base URL: ${baseUrl}`);
      const fullApiUrl = `${baseUrl}/api/user-preferences-genres?userId=${encodeURIComponent(effectiveUserId)}&type=${contentType}`;
      addLog(`Full API URL: ${fullApiUrl}`);
    }
  }, [userId, effectiveUserId, contentType, addLog]);

  // Function to load test data for the current user
  const loadTestData = useCallback(async () => {
    if (typeof window === "undefined") return;

    setIsLoadingTestData(true);
    addLog(`Loading test data for user: ${effectiveUserId}`);

    try {
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/test-data?userId=${encodeURIComponent(effectiveUserId)}`;

      const response = await fetch(apiUrl);
      addLog(`Test data API status: ${response.status}`);

      const text = await response.text();
      addLog(`Test data API response length: ${text.length} bytes`);

      try {
        const data = JSON.parse(text);

        if (data.success) {
          addLog(`Test data loaded: ${data.message}`);
          // Refresh preferences data
          if (refetch) refetch();
        } else {
          addLog(`Failed to load test data: ${data.error || "Unknown error"}`);
        }
      } catch (e) {
        addLog(`Error parsing test data response: ${e instanceof Error ? e.message : String(e)}`);
      }
    } catch (e) {
      addLog(`Error loading test data: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoadingTestData(false);
    }
  }, [effectiveUserId, addLog]);

  // Function to fetch directly from the preferences API
  const fetchFromPreferencesAPI = useCallback(async () => {
    if (typeof window === "undefined") return;

    addLog(`Fetching from main preferences API for user: ${effectiveUserId}`);
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/preferences?userId=${encodeURIComponent(effectiveUserId)}`;

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      addLog(`Preferences API fetch status: ${response.status}`);

      const text = await response.text();
      addLog(`Preferences API response length: ${text.length} bytes`);

      if (text.length > 0) {
        try {
          const data = JSON.parse(text);
          addLog(`Preferences API response: ${JSON.stringify(data).substring(0, 100)}...`);

          // After fetching from main API, refresh our component data
          refetch();
        } catch (e) {
          addLog(
            `Preferences API: Error parsing JSON: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      } else {
        addLog("Preferences API: Empty response");
      }
    } catch (e) {
      addLog(`Preferences API fetch error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [effectiveUserId, addLog, refetch]);

  // Automatically load test data after a short delay when component mounts
  useEffect(() => {
    // Wait a short time to give the component time to initialize
    const timer = setTimeout(() => {
      addLog("Auto-loading test data on component mount...");
      loadTestData();

      // After loading test data, force a direct fetch from the preferences API
      setTimeout(() => {
        addLog("Auto-fetching from main preferences API...");
        fetchFromPreferencesAPI();
      }, 1000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [loadTestData, addLog, fetchFromPreferencesAPI]);

  // Function to make a direct fetch request to the API
  const testDirectFetch = useCallback(async () => {
    if (typeof window === "undefined") return;

    addLog(`Testing direct fetch to API for user: ${effectiveUserId}`);
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/user-preferences-genres?userId=${encodeURIComponent(effectiveUserId)}&type=${contentType}`;

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      addLog(`Direct fetch status: ${response.status}`);

      const text = await response.text();
      setRawResponseData(text);
      addLog(`Direct fetch response length: ${text.length} bytes`);

      if (text.length > 0) {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            addLog(`Direct fetch: Received array with ${data.length} items`);
            data.forEach((item, index) => {
              if (index < 3) {
                // Show first 3 items only
                addLog(`Item ${index}: ${item.name}, type=${item.type}, count=${item.count}`);
              }
            });
          } else {
            addLog(
              `Direct fetch: Received non-array data: ${JSON.stringify(data).substring(0, 100)}...`
            );
          }
        } catch (e) {
          addLog(`Direct fetch: Error parsing JSON: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        addLog("Direct fetch: Empty response");
      }
    } catch (e) {
      addLog(`Direct fetch error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [effectiveUserId, contentType, addLog]);

  // Log when data changes
  useEffect(() => {
    if (data) {
      addLog(
        `Data updated: ${data.length} items with the following types: ${[...new Set(data.map((item) => item.type))].join(", ")}`
      );
    }
  }, [data, addLog]);

  // Filtruj gatunki dla wybranego typu treści
  const genres = useMemo(() => {
    if (!data) return [];

    const targetType = contentType === "film" ? "filmGenre" : "musicGenre";
    const result = data.filter((item) => item.type === targetType);

    addLog(
      `Filtrowanie ${data.length} elementów dla type=${targetType}, znaleziono ${result.length} pasujących`
    );

    return result;
  }, [data, contentType, addLog]);

  // Sprawdź, czy mamy jakieś preferencje
  const hasPreferences = genres.length > 0;

  // Logowanie odfiltrowanych gatunków
  useEffect(() => {
    addLog(
      `Odfiltrowane gatunki: ${genres.length} elementów pasujących do bieżącego contentType (${contentType})`
    );
    if (genres.length > 0) {
      addLog(`Pierwszy gatunek: ${genres[0].name}, type=${genres[0].type}`);
    } else if (data && data.length > 0) {
      addLog(
        `Brak gatunków pasujących do contentType ${contentType}. Dane mają ${data.length} elementów.`
      );
      addLog(`Obecne typy danych: ${[...new Set(data.map((item) => item.type))].join(", ")}`);
    }
  }, [genres, contentType, data, addLog]);

  const handleRefresh = () => {
    addLog("Manual refresh requested");
    testDirectFetch();
    refetch();
  };

  return (
    <div className="p-6 rounded bg-gray-900">
      <h2 className="text-3xl font-bold text-white mb-2">Twoje preferencje</h2>

      <p className="text-gray-400 text-sm mb-6">
        Ustaw swoje preferencje, aby otrzymywać lepsze rekomendacje dostosowane do Twoich gustów.
      </p>

      {/* Selektor typu treści */}
      <div className="bg-[#2C2C2C] rounded-full p-1 flex mb-8 w-40">
        <button
          className={`py-1 px-4 rounded-full text-sm font-medium ${
            contentType === "film" ? "bg-purple-600 text-white" : "text-gray-300"
          }`}
          onClick={() => setContentType("film")}
        >
          Film
        </button>
        <button
          className={`py-1 px-4 rounded-full text-sm font-medium ${
            contentType === "music" ? "bg-purple-600 text-white" : "text-gray-300"
          }`}
          onClick={() => setContentType("music")}
        >
          Muzyka
        </button>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-white">
          Twoje preferencje {contentType === "film" ? "filmowe" : "muzyczne"}
        </h3>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs border-0"
            onClick={handleRefresh}
          >
            Odśwież preferencje
          </Button>

          <Button
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs border-0"
            onClick={loadTestData}
            disabled={isLoadingTestData}
          >
            {isLoadingTestData ? "Ładowanie..." : "Załaduj dane testowe"}
          </Button>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Te preferencje są automatycznie generowane na podstawie{" "}
        {contentType === "film" ? "filmów" : "muzyki"}, które polubiłeś/aś. Kontynuuj polubienie
        większej ilości {contentType === "film" ? "filmów" : "piosenek"}, aby dopracować swoje
        preferencje.
      </p>

      {isLoading ? (
        <div className="py-6 text-center text-gray-500">Ładowanie preferencji...</div>
      ) : error ? (
        <div className="py-6 text-center text-red-400">
          Błąd ładowania preferencji: {error instanceof Error ? error.message : String(error)}
          <div className="flex gap-2 mt-2 justify-center">
            <Button size="sm" variant="outline" onClick={testDirectFetch}>
              Test bezpośredniego pobierania
            </Button>
            <Button size="sm" variant="default" onClick={loadTestData} disabled={isLoadingTestData}>
              {isLoadingTestData ? "Ładowanie..." : "Załaduj dane testowe"}
            </Button>
          </div>
        </div>
      ) : hasPreferences ? (
        <div className="bg-gray-800/50 rounded-md p-4">
          <ScrollArea className="h-full max-h-52">
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <div
                  key={genre.id}
                  className="px-3 py-1 bg-gradient-to-r from-purple-900/70 to-indigo-900/70 rounded-full text-xs text-white"
                >
                  {genre.name}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="bg-amber-900/30 border border-amber-500/40 rounded-md p-4">
          <p className="font-medium text-amber-200 mb-2">
            Brak preferencji {contentType === "film" ? "filmowych" : "muzycznych"}
          </p>
          <p className="text-amber-200/80 text-sm">
            Polub kilka {contentType === "film" ? "filmów" : "piosenek"} w rekomendacjach, aby
            automatycznie utworzyć profil preferencji. Im więcej{" "}
            {contentType === "film" ? "filmów" : "piosenek"} ocenisz, tym lepsze będą Twoje
            rekomendacje.
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={testDirectFetch}>
              Test bezpośredniego pobierania
            </Button>
            <Button size="sm" variant="default" onClick={loadTestData} disabled={isLoadingTestData}>
              {isLoadingTestData ? "Ładowanie..." : "Załaduj dane testowe"}
            </Button>
          </div>
        </div>
      )}

      {/* Sekcja debugowania */}
      <div className="mt-4 p-2 border border-gray-700 rounded bg-gray-800/50 text-xs font-mono text-gray-400">
        <div className="flex justify-between items-center mb-1">
          <p className="text-gray-500">Logi debugowania:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] bg-gray-700 hover:bg-gray-600"
              onClick={testDirectFetch}
            >
              Direct Fetch
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] bg-gray-700 hover:bg-gray-600"
              onClick={loadTestData}
              disabled={isLoadingTestData}
            >
              {isLoadingTestData ? "..." : "Test Data"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] bg-gray-700 hover:bg-gray-600"
              onClick={() => refetch()}
            >
              Force Refresh
            </Button>
          </div>
        </div>
        {debug.length > 0 ? (
          <ul className="space-y-1">
            {debug.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        ) : (
          <p>Brak logów</p>
        )}

        {/* Surowe dane odpowiedzi */}
        {rawResponseData && (
          <div className="mt-3 pt-2 border-t border-gray-700">
            <p className="font-bold text-purple-400">Surowa odpowiedź API:</p>
            <div className="mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-40">
              <pre className="text-[10px] text-gray-400 whitespace-pre-wrap">{rawResponseData}</pre>
            </div>
          </div>
        )}

        {/* Informacje diagnostyczne */}
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="font-bold text-purple-400">Podsumowanie danych:</p>
          <ul className="mt-1">
            <li>ID użytkownika: {userId || "Brak"}</li>
            <li>Efektywne ID użytkownika: {effectiveUserId}</li>
            <li>Typ treści: {contentType}</li>
            <li>Długość surowych danych: {rawResponseData?.length || 0} bajtów</li>
            <li>Liczba gatunków: {genres.length}</li>
            <li>Ma preferencje: {hasPreferences ? "tak" : "nie"}</li>
            <li>Ładowanie: {isLoading ? "tak" : "nie"}</li>
            <li>Błąd: {error ? "tak" : "nie"}</li>
            <li>Ładowanie danych testowych: {isLoadingTestData ? "tak" : "nie"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
