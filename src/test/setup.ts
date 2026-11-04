import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia if not available in jsdom
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- jsdom may not implement matchMedia at runtime
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill ResizeObserver
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- jsdom may not implement ResizeObserver at runtime
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
