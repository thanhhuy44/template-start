import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "@/lib/auth/client";

import { LoginPage } from "../login";

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
    signIn: {
      email: vi.fn(),
    },
  },
}));

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form elements correctly", () => {
    render(<LoginPage />);

    expect(
      screen.getByText("Sign In", { selector: "[data-slot='card-title']" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitBtn = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "not-an-email");
    await user.click(submitBtn);

    expect(
      await screen.findByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(authClient.signIn.email).not.toHaveBeenCalled();
  });

  it("submits valid credentials and navigates on success", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      data: { user: { id: "1" } },
      error: null,
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
      expect(toast.success).toHaveBeenCalledWith("Signed in successfully!");
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });
  });

  it("displays toast error message on login failure", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid email or password" },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
