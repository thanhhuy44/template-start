import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TodoFilter } from "../components/filter";

const mockNavigate = vi.fn();
let mockSearchParams = { page: 1, limit: 10, search: "", status: "all" };

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => mockSearchParams,
  useNavigate: () => mockNavigate,
}));

describe("TodoFilter Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { page: 1, limit: 10, search: "", status: "all" };
  });

  it("renders search input and status select element", () => {
    render(<TodoFilter />);

    expect(
      screen.getByPlaceholderText(/search todos by title or description/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("debounces search text typing and navigates after 500ms", async () => {
    const user = userEvent.setup();
    render(<TodoFilter />);

    const searchInput = screen.getByPlaceholderText(
      /search todos by title or description/i,
    );
    await user.type(searchInput, "groceries");

    // Before debounce completes
    expect(mockNavigate).not.toHaveBeenCalled();

    // After debounce completes
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it("shows reset button when filters are active and clears filters on click", async () => {
    mockSearchParams = {
      page: 1,
      limit: 10,
      search: "active-query",
      status: "in_progress",
    };
    const user = userEvent.setup();

    render(<TodoFilter />);

    const resetBtn = screen.getByRole("button", { name: /reset/i });
    expect(resetBtn).toBeInTheDocument();

    await user.click(resetBtn);

    expect(mockNavigate).toHaveBeenCalled();
  });
});
