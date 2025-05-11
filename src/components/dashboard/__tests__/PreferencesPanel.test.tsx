import React, { useState, useEffect } from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PreferencesPanel } from "../PreferencesPanel";

// Mock the FilmPreferences component
vi.mock("../FilmPreferences", () => ({
  FilmPreferences: ({
    userId,
    onPreferencesChange,
  }: {
    userId: string;
    onPreferencesChange?: () => void;
  }) => (
    <div data-testid="film-preferences" data-user-id={userId}>
      <button onClick={onPreferencesChange}>Update Preferences</button>
    </div>
  ),
}));

// Mock the toast hook
vi.mock("../../ui", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Add a test-only wrapper component at the top, outside the describe block
const TestPreferencesPanel = ({ 
  userId, 
  activeTabOverride = "film" 
}: { 
  userId: string; 
  activeTabOverride?: string 
}) => {
  const [activeTab, setActiveTab] = useState(activeTabOverride);
  
  // Force the activeTab to update when the override changes
  useEffect(() => {
    setActiveTab(activeTabOverride);
  }, [activeTabOverride]);
  
  return <PreferencesPanel 
    userId={userId} 
    // @ts-ignore - add internal props for testing
    _activeTabForTesting={activeTab}
    _setActiveTabForTesting={setActiveTab}
  />;
};

describe("PreferencesPanel", () => {
  const mockUserId = "test-user-123";
  const mockOnPreferencesUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Globalny mock fetch, który obsługuje dowolny URL
    global.fetch = vi.fn().mockImplementation((url) => {
      // Zwracaj odpowiednie dane tylko dla testów PreferencesPanel
      if (typeof url === 'string' && url.includes('/preferences')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            filmPreferences: {
              genres: ["action", "drama"],
              liked_movies: ["Movie 1", "Movie 2"],
            },
          }),
        });
      }
      // Domyślna odpowiedź
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it("renders the preferences panel with correct title", async () => {
    await act(async () => {
      render(<PreferencesPanel userId={mockUserId} />);
    });
    expect(screen.getByText("Your Preferences")).toBeInTheDocument();
  });

  it("renders film and music tabs", async () => {
    await act(async () => {
      render(<PreferencesPanel userId={mockUserId} />);
    });
    expect(screen.getByText("Film")).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
  });

  it("shows music preferences coming soon message", async () => {
    // Render with the music tab active directly
    await act(async () => {
      render(<TestPreferencesPanel userId={mockUserId} activeTabOverride="music" />);
    });
    
    // When the music tab is active, its content should be visible
    expect(screen.getByText("Music preferences coming soon!")).toBeInTheDocument();
  });

  it("renders FilmPreferences component with correct props", async () => {
    await act(async () => {
      render(
        <PreferencesPanel userId={mockUserId} onPreferencesUpdated={mockOnPreferencesUpdated} />
      );
    });
    const filmPreferences = screen.getByTestId("film-preferences");
    expect(filmPreferences).toBeInTheDocument();
    expect(filmPreferences.getAttribute("data-user-id")).toBe(mockUserId);
  });

  it("calls onPreferencesUpdated when preferences are updated", async () => {
    await act(async () => {
      render(
        <PreferencesPanel userId={mockUserId} onPreferencesUpdated={mockOnPreferencesUpdated} />
      );
    });

    const updateButton = screen.getByText("Update Preferences");
    await act(async () => {
      updateButton.click();
    });

    expect(mockOnPreferencesUpdated).toHaveBeenCalled();
  });

  it("handles fetch error gracefully", async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn().mockImplementation(() => Promise.reject(new Error("Failed to fetch")));

    await act(async () => {
      render(<PreferencesPanel userId={mockUserId} />);
    });

    // Component should still render without crashing
    expect(screen.getByText("Your Preferences")).toBeInTheDocument();
  });
});
