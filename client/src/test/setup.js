import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

expect.extend(toHaveNoViolations);

// App.jsx code-splits its dialogs behind React.lazy(); under `--coverage`
// instrumentation (and CI's shared CPU), the dynamic import + first render of
// the heavier ones (HelpDialog's react-markdown/remark-gfm parse especially)
// can take longer than testing-library's 1000ms default findBy/waitFor
// timeout. Give async queries more headroom globally rather than special-
// casing every test that opens a lazy-loaded dialog.
configure({ asyncUtilTimeout: 3000 });

import { resetViewport } from "./viewport.js";

afterEach(() => {
  cleanup();
  // Restore the default (desktop) viewport between tests so a mobile test
  // can't leak its breakpoint into the next one.
  resetViewport();
});

function createMemoryStorage() {
  const map = new Map();
  return {
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    get length() {
      return map.size;
    },
  };
}

const storage = createMemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true,
  writable: true,
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
}
