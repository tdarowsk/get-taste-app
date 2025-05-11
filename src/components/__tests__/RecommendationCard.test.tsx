import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecommendationCard } from "../RecommendationCard";
import type { EnhancedRecommendationViewModel } from "../../types/recommendations";
import type { RecommendationDTO } from "../../types";

// Minimal mock subcomponents are already tested separately

describe("RecommendationCard", () => {
  const mockDTO: RecommendationDTO = {
    id: 42,
    user_id: "user-1",
    type: "music",
    data: {
      title: "T",
      description: "D",
      items: [],
    },
    created_at: "2023-01-01",
  };

  const mockReason = {
    primaryReason: "Primary",
    detailedReasons: [],
    relatedItems: [],
  };

  const baseModel: EnhancedRecommendationViewModel = {
    recommendation: mockDTO,
    reason: mockReason,
    metadataInsight: {
      recommendationId: 42,
      primaryFactors: [],
      secondaryFactors: [],
      uniqueFactors: [],
    },
    isNew: false,
  };

  it("renders content and reason components", () => {
    const onFeedback = vi.fn();
    render(<RecommendationCard recommendation={baseModel} onFeedback={onFeedback} />);
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("calls onFeedback with like when like button clicked", () => {
    const onFeedback = vi.fn();
    render(<RecommendationCard recommendation={baseModel} onFeedback={onFeedback} />);
    const likeBtn = screen.getByLabelText("Lubię");
    fireEvent.click(likeBtn);
    expect(onFeedback).toHaveBeenCalledWith(42, "like");
  });

  it("calls onFeedback with dislike when dislike button clicked", () => {
    const onFeedback = vi.fn();
    render(<RecommendationCard recommendation={baseModel} onFeedback={onFeedback} />);
    const dislikeBtn = screen.getByLabelText("Nie lubię");
    fireEvent.click(dislikeBtn);
    expect(onFeedback).toHaveBeenCalledWith(42, "dislike");
  });

  it("calls onFeedback on swipe right gesture (mouse)", () => {
    const onFeedback = vi.fn();
    render(<RecommendationCard recommendation={baseModel} onFeedback={onFeedback} />);
    // simulate swipe right on container div
    const container = screen.getByText("T").closest("div");
    if (container) {
      fireEvent.mouseDown(container, { clientX: 0, clientY: 0 });
      fireEvent.mouseUp(container, { clientX: 100, clientY: 0 });
      expect(onFeedback).toHaveBeenCalledWith(42, "like");
    }
  });

  it("calls onFeedback on swipe left gesture (mouse)", () => {
    const onFeedback = vi.fn();
    render(<RecommendationCard recommendation={baseModel} onFeedback={onFeedback} />);
    const container = screen.getByText("T").closest("div");
    if (container) {
      fireEvent.mouseDown(container, { clientX: 100, clientY: 0 });
      fireEvent.mouseUp(container, { clientX: 0, clientY: 0 });
      expect(onFeedback).toHaveBeenCalledWith(42, "dislike");
    }
  });
});
