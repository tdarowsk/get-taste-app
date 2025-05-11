import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FavoriteFilmGenres } from "../FavoriteFilmGenres";
import { RecommendationHistory } from "../RecommendationHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserDashboardProps {
  userId: string;
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState("recommendations");

  // Pobieramy profil użytkownika z API
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("Nie udało się pobrać profilu użytkownika");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minut
  });

  return (
    <div className="container mx-auto py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Witaj, {profileLoading ? "..." : userProfile?.nick || "użytkowniku"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Odkryj spersonalizowane rekomendacje dopasowane do Twojego gustu.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel boczny z analizą preferencji */}
        <div className="md:col-span-1 space-y-6">
          <FavoriteFilmGenres userId={userId} />

          {/* Tutaj można dodać inne komponenty widżetów, np. ulubione gatunki muzyczne */}
        </div>

        {/* Główna sekcja */}
        <div className="md:col-span-2">
          <Tabs defaultValue="recommendations" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="recommendations">Rekomendacje</TabsTrigger>
              <TabsTrigger value="history">Historia</TabsTrigger>
              <TabsTrigger value="settings">Ustawienia</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Twoje rekomendacje</h2>
              <p className="text-muted-foreground">
                Tutaj zobaczysz najnowsze rekomendacje dopasowane do Twojego gustu.
              </p>

              {/* Tutaj będzie komponent z rekomendacjami */}
            </TabsContent>

            <TabsContent value="history">
              <RecommendationHistory userId={userId} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Ustawienia profilu</h2>
              <p className="text-muted-foreground">
                Zarządzaj swoimi preferencjami i ustawieniami konta.
              </p>

              {/* Tutaj będą ustawienia użytkownika */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
