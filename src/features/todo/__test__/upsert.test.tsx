import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ContextModule from "../context";
import { UpsertTodo } from "../modals/upsert";

describe("UpsertTodo Component", () => {
  const mockSetAction = vi.fn();
  const mockSetSelectedTodo = vi.fn();
  const mockCreateMutate = vi.fn();
  const mockUpdateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when action is null", () => {
    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: null,
      setAction: mockSetAction,
      selectedTodo: null,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {} as never,
      createMutation: { mutate: mockCreateMutate, isPending: false } as never,
      updateMutation: { mutate: mockUpdateMutate, isPending: false } as never,
      deleteMutation: {} as never,
    });

    const { container } = render(<UpsertTodo />);
    expect(container.firstChild).toBeNull();
  });

  it("renders create mode and submits valid new todo", async () => {
    const user = userEvent.setup();

    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: "create",
      setAction: mockSetAction,
      selectedTodo: null,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {} as never,
      createMutation: { mutate: mockCreateMutate, isPending: false } as never,
      updateMutation: { mutate: mockUpdateMutate, isPending: false } as never,
      deleteMutation: {} as never,
    });

    render(<UpsertTodo />);

    expect(
      screen.getByText("Create Todo", { selector: "[data-slot='card-title']" }),
    ).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const submitBtn = screen.getByRole("button", { name: "Create Todo" });

    await user.type(titleInput, "Deploy fullstack application");
    await user.type(descInput, "Verify all routes and SSR");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith({
        name: "Deploy fullstack application",
        description: "Verify all routes and SSR",
        status: "draft",
      });
    });
  });

  it("renders edit mode with prepopulated values and calls update mutation", async () => {
    const user = userEvent.setup();
    const existingTodo = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Existing Task",
      description: "Existing Description",
      status: "in_progress" as const,
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: "update",
      setAction: mockSetAction,
      selectedTodo: existingTodo,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {} as never,
      createMutation: { mutate: mockCreateMutate, isPending: false } as never,
      updateMutation: { mutate: mockUpdateMutate, isPending: false } as never,
      deleteMutation: {} as never,
    });

    render(<UpsertTodo />);

    expect(
      screen.getByText("Edit Todo", { selector: "[data-slot='card-title']" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Existing Description"),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Save Changes" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: existingTodo.id,
        body: {
          name: "Existing Task",
          description: "Existing Description",
          status: "in_progress",
        },
      });
    });
  });

  it("closes modal on cancel click", async () => {
    const user = userEvent.setup();

    vi.spyOn(ContextModule, "useTodoContext").mockReturnValue({
      action: "create",
      setAction: mockSetAction,
      selectedTodo: null,
      setSelectedTodo: mockSetSelectedTodo,
      listQuery: {} as never,
      createMutation: { mutate: mockCreateMutate, isPending: false } as never,
      updateMutation: { mutate: mockUpdateMutate, isPending: false } as never,
      deleteMutation: {} as never,
    });

    render(<UpsertTodo />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(mockSetAction).toHaveBeenCalledWith(null);
    expect(mockSetSelectedTodo).toHaveBeenCalledWith(null);
  });
});
