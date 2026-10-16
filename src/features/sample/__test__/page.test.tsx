import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SamplePage } from "../index";

describe("Sample Page Assembly", () => {
  it("renders page layout with default empty state", () => {
    render(<SamplePage />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });
});
