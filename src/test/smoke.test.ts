import { describe, expect, it } from "vitest";

describe("Vitest Environment Smoke Test", () => {
  it("runs tests in jsdom environment with DOM globals", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
    const div = document.createElement("div");
    div.textContent = "Vitest is working";
    document.body.appendChild(div);
    expect(document.body).toHaveTextContent("Vitest is working");
  });
});
