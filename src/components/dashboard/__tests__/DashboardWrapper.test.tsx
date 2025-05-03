import React from "react";
import { describe, it, expect, vi } from "vitest";
// Mock path alias for utils
vi.mock("@/lib/utils", () => ({ cn: (...classes: string[]) => classes.filter(Boolean).join(" ") }));
import { render, screen } from "@testing-library/react";

// Mock DashboardLayout to inspect props
vi.mock("../../dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ user }: { user: { id: string } }) => <div data-testid="dashboard-layout">USER_ID:{user.id}</div>,
}));

// Mock UI module to avoid deep UI imports
vi.mock("../../ui", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast">{children}</div>,
}));

import { DashboardWrapper } from "../DashboardWrapper";
import type { UserProfileDTO } from "../../../types";

describe("DashboardWrapper", () => {
  const mockUser: UserProfileDTO = {
    id: "user-123",
    email: "test@example.com",
    nick: "tester",
    created_at: "2024-01-01",
    updated_at: "2024-01-02",
  };

  it("renders DashboardLayout with correct user prop inside providers", () => {
    render(<DashboardWrapper user={mockUser} />);
    const layout = screen.getByTestId("dashboard-layout");
    expect(layout).toHaveTextContent("USER_ID:user-123");
  });
});
