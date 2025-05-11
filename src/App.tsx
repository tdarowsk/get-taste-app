import React from "react";
import { RecommendationsView } from "./domains/recommendations";

function App() {
  // In a real app, this would come from authentication
  const userId = "current-user-id";

  return (
    <div className="App">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">getTaste App</h1>
      </header>

      <main>
        <RecommendationsView userId={userId} />
      </main>
    </div>
  );
}

export default App;
