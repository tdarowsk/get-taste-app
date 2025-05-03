import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock subcomponents
vi.mock("../Header", () => ({
  Header: ({ user }: { user: { id: string } }) => <div data-testid="header">HEADER_USER:{user.id}</div>,
}));
vi.mock("../RecommendationsPanel", () => ({
  RecommendationsPanel: ({
    activeType,
    recommendations,
    isLoading,
    isNewUser,
    userId,
  }: {
    activeType: string;
    recommendations: unknown;
    isLoading: boolean;
    isNewUser: boolean;
    userId: string;
  }) => (
    <div
      data-testid="recommendations-panel"
      data-active-type={activeType}
      data-recommendations={JSON.stringify(recommendations)}
      data-loading={String(isLoading)}
      data-new-user={String(isNewUser)}
      data-user-id={userId}
    />
  ),
}));
vi.mock("../../ui/RecommendationSidebar", () => ({
  default: ({ userId, isNewUser }: { userId: string; isNewUser: boolean }) => (
    <div data-testid="recommendation-sidebar" data-user-id={userId} data-new-user={String(isNewUser)} />
  ),
}));

// Mock useDashboard hook
const mockUseDashboard = {
  activeType: "music",
  setActiveType: vi.fn(),
  // initialize recommendations with proper type to allow assignment
  recommendations: undefined as { id: number }[] | undefined,
  isRecommendationsLoading: false,
  refreshRecommendations: vi.fn(),
  isGeneratingRecommendations: false,
  isNewUser: true,
};
vi.mock("../../../lib/hooks/useDashboard", () => ({ useDashboard: () => mockUseDashboard }));

import { DashboardLayout } from "../DashboardLayout";
import type { UserProfileDTO } from "../../../types";

describe("DashboardLayout", () => {
  const mockUser: UserProfileDTO = { id: "u1", email: "", nick: "", created_at: "", updated_at: "" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.recommendations = undefined;
    mockUseDashboard.isRecommendationsLoading = false;
    mockUseDashboard.isNewUser = true;
  });

  it("calls refreshRecommendations on mount when no data and not loading", () => {
    render(<DashboardLayout user={mockUser} />);
    expect(mockUseDashboard.refreshRecommendations).toHaveBeenCalled();
  });

  it("renders welcome banner when isNewUser=true and calls refresh on button click", () => {
    render(<DashboardLayout user={mockUser} />);
    expect(screen.getByText("Welcome to getTaste!")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(btn);
    expect(mockUseDashboard.refreshRecommendations).toHaveBeenCalledTimes(2); // mount + click
  });

  it("does not render welcome banner when isNewUser=false", () => {
    mockUseDashboard.isNewUser = false;
    render(<DashboardLayout user={mockUser} />);
    expect(screen.queryByText("Welcome to getTaste!")).toBeNull();
  });

  it("renders Header with user prop", () => {
    render(<DashboardLayout user={mockUser} />);
    expect(screen.getByTestId("header")).toHaveTextContent("HEADER_USER:u1");
  });

  it("renders RecommendationsPanel with proper props", () => {
    mockUseDashboard.recommendations = [{ id: 1 }];
    render(<DashboardLayout user={mockUser} />);
    const panel = screen.getByTestId("recommendations-panel");
    expect(panel.getAttribute("data-active-type")).toBe("music");
    const recAttr = panel.getAttribute("data-recommendations");
    expect(recAttr).not.toBeNull();
    expect(JSON.parse(recAttr as string)).toEqual([{ id: 1 }]);
    expect(panel.getAttribute("data-loading")).toBe("false");
    expect(panel.getAttribute("data-new-user")).toBe("true");
    expect(panel.getAttribute("data-user-id")).toBe("u1");
  });

  it("renders preferences sidebar static UI", () => {
    render(<DashboardLayout user={mockUser} />);
    expect(screen.getByText("Your Preferences")).toBeInTheDocument();
    expect(screen.getByText("Music Preferences")).toBeInTheDocument();
    expect(screen.getByText("Film Preferences")).toBeInTheDocument();
  });

  it("renders RecommendationSidebar with props", () => {
    render(<DashboardLayout user={mockUser} />);
    const sidebar = screen.getByTestId("recommendation-sidebar");
    expect(sidebar.getAttribute("data-user-id")).toBe("u1");
    expect(sidebar.getAttribute("data-new-user")).toBe("true");
  });
});
