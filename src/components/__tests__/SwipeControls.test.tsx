import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SwipeControls } from "../SwipeControls";

describe("SwipeControls", () => {
  it("calls onLike when like button is clicked", () => {
    const onLike = vi.fn();
    const onDislike = vi.fn();
    render(<SwipeControls onLike={onLike} onDislike={onDislike} />);
    const likeBtn = screen.getByLabelText("Lubię");
    fireEvent.click(likeBtn);
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onDislike).not.toHaveBeenCalled();
  });

  it("calls onDislike when dislike button is clicked", () => {
    const onLike = vi.fn();
    const onDislike = vi.fn();
    render(<SwipeControls onLike={onLike} onDislike={onDislike} />);
    const dislikeBtn = screen.getByLabelText("Nie lubię");
    fireEvent.click(dislikeBtn);
    expect(onDislike).toHaveBeenCalledTimes(1);
    expect(onLike).not.toHaveBeenCalled();
  });

  it("disables buttons when disabled prop is true", () => {
    const onLike = vi.fn();
    const onDislike = vi.fn();
    render(<SwipeControls onLike={onLike} onDislike={onDislike} disabled={true} />);
    const likeBtn = screen.getByLabelText("Lubię");
    const dislikeBtn = screen.getByLabelText("Nie lubię");
    expect(likeBtn).toBeDisabled();
    expect(dislikeBtn).toBeDisabled();
    fireEvent.click(likeBtn);
    fireEvent.click(dislikeBtn);
    expect(onLike).not.toHaveBeenCalled();
    expect(onDislike).not.toHaveBeenCalled();
  });
});
