import { describe, expect, it } from "vitest";

import { todoRouter } from "../todo";

describe("todoRouter oRPC CRUD structure", () => {
  it("defines all standard CRUD procedure methods", () => {
    expect(todoRouter.getAll).toBeDefined();
    expect(todoRouter.getById).toBeDefined();
    expect(todoRouter.create).toBeDefined();
    expect(todoRouter.update).toBeDefined();
    expect(todoRouter.delete).toBeDefined();
  });
});
