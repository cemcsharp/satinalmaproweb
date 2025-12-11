import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../../src/components/ui/Button";

describe("Button Component", () => {
  it("renders with children text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", true);
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("applies variant classes correctly", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.innerHTML).toContain("border");
  });

  it("applies size classes correctly", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.innerHTML).toContain("text-xs");
  });
});