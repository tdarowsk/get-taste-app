import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecommendationReason } from "../RecommendationReason";
import type { RecommendationReason as ReasonType } from "../../types/recommendations";

describe("RecommendationReason", () => {
  const baseReason: ReasonType = {
    primaryReason: "Primary reason text",
    detailedReasons: ["Detail1", "Detail2"],
    relatedItems: [{ id: "a", name: "ItemA", similarity: 0.75 }],
  };

  it("renders primary reason always", () => {
    render(<RecommendationReason reason={baseReason} />);
    expect(screen.getByText("Primary reason text")).toBeInTheDocument();
  });

  it("toggles expansion in uncontrolled mode", () => {
    render(<RecommendationReason reason={baseReason} />);
    const toggleButton = screen.getByRole("button");
    // initially collapsed
    expect(toggleButton).toHaveTextContent("Więcej szczegółów");
    expect(screen.queryByText("Detail1")).toBeNull();

    // expand
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent("Mniej szczegółów");
    expect(screen.getByText("Detail1")).toBeInTheDocument();
    expect(screen.getByText("ItemA")).toBeInTheDocument();

    // collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent("Więcej szczegółów");
    expect(screen.queryByText("Detail1")).toBeNull();
  });

  it("uses controlled expansion and onToggle callback", () => {
    const onToggle = vi.fn();
    // controlled expanded=true
    render(<RecommendationReason reason={baseReason} expanded={true} onToggle={onToggle} />);
    const toggleButton = screen.getByRole("button");
    // should show expanded
    expect(toggleButton).toHaveTextContent("Mniej szczegółów");
    expect(screen.getByText("Detail2")).toBeInTheDocument();

    // clicking should call onToggle but not change text
    fireEvent.click(toggleButton);
    expect(onToggle).toHaveBeenCalled();
    expect(toggleButton).toHaveTextContent("Mniej szczegółów");
  });

  it("does not render detailed or related sections when arrays empty", () => {
    const reasonEmpty: ReasonType = { primaryReason: "P", detailedReasons: [], relatedItems: [] };
    render(<RecommendationReason reason={reasonEmpty} expanded={true} />);
    expect(screen.queryByText("Szczegółowe powody:")).toBeNull();
    expect(screen.queryByText("Powiązane z rzeczami, które lubisz:")).toBeNull();
  });
});
