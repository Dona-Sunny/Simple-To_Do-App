export const STORAGE_KEY = "simple-todo-app.tasks";

export function initTodoApp({
  document,
  storage,
  createId = () => globalThis.crypto.randomUUID(),
  now = () => Date.now(),
}) {
  const form = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const prioritySelect = document.getElementById("priority-select");
  const validationMessage = document.getElementById("validation-message");
  const taskList = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const activeCount = document.getElementById("active-count");
  const template = document.getElementById("task-item-template");

  let tasks = loadTasks();

  renderTasks();
  taskInput.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (!text) {
      validationMessage.textContent = "Please enter a task before adding it.";
      taskInput.focus();
      return;
    }

    tasks.push({
      id: createId(),
      text,
      priority,
      completed: false,
      createdAt: now(),
    });

    persistTasks();
    renderTasks();
    resetForm();
  });

  taskList.addEventListener("click", (event) => {
    const target = event.target;
    const taskItem = target.closest("[data-task-id]");

    if (!taskItem) {
      return;
    }

    const { taskId } = taskItem.dataset;

    if (target.classList.contains("delete-button")) {
      tasks = tasks.filter((task) => task.id !== taskId);
      persistTasks();
      renderTasks();
    }
  });

  taskList.addEventListener("change", (event) => {
    const target = event.target;

    if (!target.classList.contains("task-toggle")) {
      return;
    }

    const taskItem = target.closest("[data-task-id]");

    if (!taskItem) {
      return;
    }

    const { taskId } = taskItem.dataset;
    const task = tasks.find((entry) => entry.id === taskId);

    if (!task) {
      return;
    }

    task.completed = target.checked;
    persistTasks();
    renderTasks();
  });

  taskInput.addEventListener("input", () => {
    if (validationMessage.textContent) {
      validationMessage.textContent = "";
    }
  });

  return {
    getTasks() {
      return [...tasks];
    },
  };

  function renderTasks() {
    taskList.innerHTML = "";

    const sortedTasks = [...tasks].sort((left, right) => left.createdAt - right.createdAt);

    sortedTasks.forEach((task) => {
      const fragment = template.content.cloneNode(true);
      const taskItem = fragment.querySelector(".task-item");
      const taskToggle = fragment.querySelector(".task-toggle");
      const taskText = fragment.querySelector(".task-text");
      const priorityBadge = fragment.querySelector(".priority-badge");

      taskItem.dataset.taskId = task.id;
      taskItem.classList.toggle("is-complete", task.completed);

      taskToggle.checked = task.completed;
      taskToggle.setAttribute("aria-label", `Mark ${task.text} as complete`);
      taskText.textContent = task.text;
      priorityBadge.textContent = task.priority;
      priorityBadge.classList.add(`priority-${task.priority}`);

      taskList.appendChild(fragment);
    });

    emptyState.hidden = sortedTasks.length > 0;
    activeCount.textContent = String(tasks.filter((task) => !task.completed).length);
  }

  function resetForm() {
    form.reset();
    prioritySelect.value = "medium";
    validationMessage.textContent = "";
    taskInput.focus();
  }

  function loadTasks() {
    try {
      const storedTasks = storage.getItem(STORAGE_KEY);

      if (!storedTasks) {
        return [];
      }

      const parsedTasks = JSON.parse(storedTasks);

      if (!Array.isArray(parsedTasks)) {
        return [];
      }

      return parsedTasks.filter(isValidTask);
    } catch {
      return [];
    }
  }

  function persistTasks() {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}

function isValidTask(task) {
  return (
    task &&
    typeof task.id === "string" &&
    typeof task.text === "string" &&
    typeof task.priority === "string" &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "number"
  );
}
