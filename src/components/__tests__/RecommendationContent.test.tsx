import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecommendationContent } from "../RecommendationContent";
import type { RecommendationItem, RecommendationDataDetails } from "../../types";

describe("RecommendationContent", () => {
  const data: RecommendationDataDetails = {
    title: "Sample Title",
    description: "Sample description",
    items: [],
  };

  it("renders title and description when provided", () => {
    render(<RecommendationContent data={data} items={[]} />);
    expect(screen.getByText("Sample Title")).toBeInTheDocument();
    expect(screen.getByText("Sample description")).toBeInTheDocument();
  });

  it("does not render title or description when missing", () => {
    render(<RecommendationContent data={{ title: "", description: "", items: [] }} items={[]} />);
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(screen.queryByText("Sample description")).toBeNull();
  });

  it("does not render items section when items array is empty", () => {
    render(<RecommendationContent data={data} items={[]} />);
    expect(screen.queryAllByTestId("item-card")).toHaveLength(0);
  });

  it("renders list of items with details and image", () => {
    const items: RecommendationItem[] = [
      {
        id: "1",
        name: "Item1",
        type: "Type1",
        details: {
          imageUrl: "http://example.com/img.png",
          color: "red",
        },
      },
    ];
    render(<RecommendationContent data={data} items={items} />);
    expect(screen.getByText("Item1")).toBeInTheDocument();
    expect(screen.getByText("Type1")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Item1" })).toHaveAttribute(
      "src",
      "http://example.com/img.png"
    );
    expect(screen.getByText("color:")).toBeInTheDocument();
    expect(screen.getByText("red")).toBeInTheDocument();
  });
});
