import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { JSDOM } from "jsdom";

import { initTodoApp, STORAGE_KEY } from "../app.js";

const html = readFileSync(resolve("index.html"), "utf8");

function createStorage(initialData = {}) {
  const data = new Map(Object.entries(initialData));

  return {
    clear() {
      data.clear();
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    removeItem(key) {
      data.delete(key);
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
  };
}

function setupApp({ storage = createStorage() } = {}) {
  const dom = new JSDOM(html, { url: "http://localhost" });

  initTodoApp({
    document: dom.window.document,
    storage,
    createId: () => "task-1",
    now: () => 1000,
  });

  return { document: dom.window.document, storage };
}

describe("Simple To-Do app", () => {
  let storage;

  beforeEach(() => {
    storage = createStorage();
  });

  test("adds a task with the selected priority to the active list", () => {
    const { document } = setupApp({ storage });

    document.getElementById("task-input").value = "Finish assignment";
    document.getElementById("priority-select").value = "high";
    document.getElementById("task-form").dispatchEvent(
      new document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );

    expect(document.querySelectorAll(".task-item")).toHaveLength(1);
    expect(document.querySelector(".task-text")?.textContent).toBe("Finish assignment");
    expect(document.querySelector(".priority-badge")?.textContent).toBe("high");
    expect(document.getElementById("active-count")?.textContent).toBe("1");
  });

  test("rejects empty task input with inline validation", () => {
    const { document } = setupApp({ storage });

    document.getElementById("task-form").dispatchEvent(
      new document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );

    expect(document.querySelectorAll(".task-item")).toHaveLength(0);
    expect(document.getElementById("validation-message")?.textContent).toBe(
      "Please enter a task before adding it."
    );
    expect(document.getElementById("empty-state")?.hidden).toBe(false);
  });

  test("keeps added tasks in the active task list with the correct count", () => {
    const { document } = setupApp({ storage });

    document.getElementById("task-input").value = "Buy groceries";
    document.getElementById("task-form").dispatchEvent(
      new document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );
    document.getElementById("task-input").value = "Review notes";
    document.getElementById("priority-select").value = "low";
    document.getElementById("task-form").dispatchEvent(
      new document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );

    expect(
      [...document.querySelectorAll(".task-text")].map((item) => item.textContent)
    ).toEqual(["Buy groceries", "Review notes"]);
    expect(document.getElementById("active-count")?.textContent).toBe("2");
    expect(document.getElementById("empty-state")?.hidden).toBe(true);
  });

  test("toggles task completion without removing the task from the list", () => {
    const { document } = setupApp({ storage });

    document.getElementById("task-input").value = "Wash dishes";
    document.getElementById("task-form").dispatchEvent(
      new document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );

    const checkbox = document.querySelector(".task-toggle");
    checkbox.checked = true;
    checkbox.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));

    expect(document.querySelectorAll(".task-item")).toHaveLength(1);
    expect(document.querySelector(".task-item")?.classList.contains("is-complete")).toBe(true);
    expect(document.getElementById("active-count")?.textContent).toBe("0");
  });

  test("deletes a task from the list", () => {
    const { document } = setupApp({ storage });

    document.getElementById("task-input").value = "Archive notes";
    document.getElementById("task-form").dispatchEvent(
      new document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );

    document
      .querySelector(".delete-button")
      ?.dispatchEvent(new document.defaultView.Event("click", { bubbles: true }));

    expect(document.querySelectorAll(".task-item")).toHaveLength(0);
    expect(document.getElementById("active-count")?.textContent).toBe("0");
    expect(document.getElementById("empty-state")?.hidden).toBe(false);
  });

  test("persists tasks locally across app reloads", () => {
    let setup = setupApp({ storage });

    setup.document.getElementById("task-input").value = "Prepare demo";
    setup.document.getElementById("priority-select").value = "high";
    setup.document.getElementById("task-form").dispatchEvent(
      new setup.document.defaultView.Event("submit", { bubbles: true, cancelable: true })
    );

    const persistedTasks = storage.getItem(STORAGE_KEY);
    expect(persistedTasks).toContain("Prepare demo");

    setup = setupApp({ storage });

    expect(setup.document.querySelectorAll(".task-item")).toHaveLength(1);
    expect(setup.document.querySelector(".task-text")?.textContent).toBe("Prepare demo");
    expect(setup.document.querySelector(".priority-badge")?.textContent).toBe("high");
    expect(setup.document.getElementById("active-count")?.textContent).toBe("1");
  });
});
