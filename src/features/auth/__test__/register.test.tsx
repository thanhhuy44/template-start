import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "@/lib/auth/client";

import { Register } from "../register";

const mockNavigate = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

describe("Register Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<Register />);

    expect(
      screen.getByText("Create an account", {
        selector: "[data-slot='card-title']",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<Register />);

    await user.type(screen.getByLabelText(/^name/i), "John Doe");
    await user.type(screen.getByLabelText(/^email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("submits registration successfully and navigates", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      data: { user: { id: "1" } },
      error: null,
    });

    render(<Register />);

    await user.type(screen.getByLabelText(/^name/i), "John Doe");
    await user.type(screen.getByLabelText(/^email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully!",
      );
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });
  });

  it("displays toast error message on registration failure", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      data: null,
      error: { message: "Email already in use" },
    });

    render(<Register />);

    await user.type(screen.getByLabelText(/^name/i), "John Doe");
    await user.type(screen.getByLabelText(/^email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already in use");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
