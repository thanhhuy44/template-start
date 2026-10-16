import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { List } from "../components/list";
import * as ContextModule from "../context";

describe("Sample List Component", () => {
  it("renders loading state when isLoading is true", () => {
    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: null,
      setSelectedItem: vi.fn(),
      isLoading: true,
    });

    render(<List />);
    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "Loading items...",
    );
  });

  it("renders empty state when items is empty", () => {
    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: null,
      setSelectedItem: vi.fn(),
      isLoading: false,
    });

    render(<List />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      "No items found.",
    );
  });

  it("renders list of items and handles click selection", async () => {
    const user = userEvent.setup();
    const setSelectedItem = vi.fn();
    const mockItems = [
      { id: 1, title: "Item 1" },
      { id: 2, title: "Item 2" },
    ];

    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: mockItems,
      selectedItem: null,
      setSelectedItem,
      isLoading: false,
    });

    render(<List />);
    const item1 = screen.getByText("Item 1");
    expect(item1).toBeInTheDocument();

    await user.click(item1);
    expect(setSelectedItem).toHaveBeenCalledWith(mockItems[0]);
  });
});
