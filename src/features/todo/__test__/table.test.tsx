import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TodoTable } from "../components/table";
import * as ContextModule from "../context";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => ({ page: 1, limit: 10 }),
  useNavigate: () => mockNavigate,
}));

describe("TodoTable Component", () => {
  const mockSetAction = vi.fn();
  const mockSetSelectedTodo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state when isLoading is true and no data", () => {
    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: null,
      setAction: mockSetAction,
      selectedTodo: null,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {
        data: undefined,
        isLoading: true,
        isError: false,
      } as never,
      createMutation: {} as never,
      updateMutation: {} as never,
      deleteMutation: {} as never,
    });

    render(<TodoTable />);
    expect(screen.getByText("Loading todos...")).toBeInTheDocument();
  });

  it("renders empty state when list has no items", () => {
    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: null,
      setAction: mockSetAction,
      selectedTodo: null,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {
        data: { data: [], pagination: { page: 1, limit: 10, total: 0 } },
        isLoading: false,
        isError: false,
      } as never,
      createMutation: {} as never,
      updateMutation: {} as never,
      deleteMutation: {} as never,
    });

    render(<TodoTable />);
    expect(screen.getByText(/no todos found/i)).toBeInTheDocument();
  });

  it("renders todo items with status badges and action buttons", async () => {
    const user = userEvent.setup();
    const mockTodo = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Complete TanStack Start setup",
      description: "Implement SSR and filtering",
      status: "done" as const,
      createdBy: "user-1",
      createdAt: new Date("2026-11-04"),
      updatedAt: new Date("2026-11-04"),
    };

    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: null,
      setAction: mockSetAction,
      selectedTodo: null,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {
        data: {
          data: [mockTodo],
          pagination: { page: 1, limit: 10, total: 1 },
        },
        isLoading: false,
        isError: false,
      } as never,
      createMutation: {} as never,
      updateMutation: {} as never,
      deleteMutation: {} as never,
    });

    render(<TodoTable />);

    expect(
      screen.getByText("Complete TanStack Start setup"),
    ).toBeInTheDocument();
    expect(screen.getByText("Implement SSR and filtering")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();

    const editBtn = screen.getByRole("button", {
      name: /edit complete tanstack/i,
    });
    await user.click(editBtn);
    expect(mockSetSelectedTodo).toHaveBeenCalledWith(mockTodo);
    expect(mockSetAction).toHaveBeenCalledWith("update");

    const deleteBtn = screen.getByRole("button", {
      name: /delete complete tanstack/i,
    });
    await user.click(deleteBtn);
    expect(mockSetSelectedTodo).toHaveBeenCalledWith(mockTodo);
    expect(mockSetAction).toHaveBeenCalledWith("delete");
  });
});
