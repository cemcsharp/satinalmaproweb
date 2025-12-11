import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "../../src/components/ui/Input";

describe("Input Component", () => {
    it("renders with label", () => {
        render(<Input label="Email" />);
        expect(screen.getByText("Email")).toBeDefined();
    });

    it("handles value change", () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "test@email.com" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("displays error message", () => {
        render(<Input error="This field is required" />);
        expect(screen.getByText("This field is required")).toBeDefined();
    });

    it("applies disabled state", () => {
        render(<Input disabled />);
        const input = screen.getByRole("textbox");
        expect(input).toHaveProperty("disabled", true);
    });
});
