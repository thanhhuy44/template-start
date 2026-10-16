import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DetailCard } from "../components/card";
import * as ContextModule from "../context";

describe("Sample DetailCard Component", () => {
  it("renders nothing when selectedItem is null", () => {
    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: null,
      setSelectedItem: vi.fn(),
      isLoading: false,
    });

    const { container } = render(<DetailCard />);
    expect(container.firstChild).toBeNull();
  });

  it("renders item title and triggers close handler", async () => {
    const user = userEvent.setup();
    const setSelectedItem = vi.fn();

    vi.spyOn(ContextModule, "useSampleContext").mockReturnValue({
      items: [],
      selectedItem: { id: 10, title: "Active Post" },
      setSelectedItem,
      isLoading: false,
    });

    render(<DetailCard />);
    expect(screen.getByText("Active Post")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);
    expect(setSelectedItem).toHaveBeenCalledWith(null);
  });
});
