const STORAGE_KEY = "task-notebook-items";

const seed = [
  { id: "seed-1", text: "見積書をA社へ再送する", done: false },
  { id: "seed-2", text: "週次レポートをまとめる", done: false },
  { id: "seed-3", text: "会議室を予約する", done: true },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed or inaccessible storage
  }
  return seed.slice();
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage may be unavailable; state simply won't persist
  }
}

let tasks = load();
let filter = "all";

const listEl = document.getElementById("task-list");
const form = document.getElementById("add-form");
const input = document.getElementById("new-task");
const remainingEl = document.getElementById("remaining-count");
const clearBtn = document.getElementById("clear-done");
const tabs = document.querySelectorAll(".tab");
const todayEl = document.getElementById("today");

todayEl.textContent = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
}).format(new Date());

function visible() {
  if (filter === "active") return tasks.filter((t) => !t.done);
  if (filter === "done") return tasks.filter((t) => t.done);
  return tasks;
}

function render() {
  listEl.innerHTML = "";
  const items = visible();

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = filter === "done" ? "まだ完了した項目はありません" : "書き込みはありません";
    listEl.appendChild(li);
  }

  for (const task of items) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");

    const check = document.createElement("button");
    check.type = "button";
    check.className = "check-btn" + (task.done ? " done" : "");
    check.setAttribute("aria-pressed", String(task.done));
    check.setAttribute("aria-label", task.done ? "未完了に戻す" : "完了にする");
    check.addEventListener("click", () => {
      task.done = !task.done;
      save(tasks);
      render();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    text.title = "クリックして編集";
    text.addEventListener("click", () => startEdit(task, text));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.setAttribute("aria-label", "削除");
    remove.textContent = "✕";
    remove.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      save(tasks);
      render();
    });

    li.append(check, text, remove);
    listEl.appendChild(li);
  }

  const remaining = tasks.filter((t) => !t.done).length;
  remainingEl.textContent = remaining + " 件残り";
}

function startEdit(task, textEl) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "task-edit";
  editInput.value = task.text;
  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  const commit = () => {
    const val = editInput.value.trim();
    if (val) task.text = val;
    save(tasks);
    render();
  };

  editInput.addEventListener("blur", commit);
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") editInput.blur();
    if (e.key === "Escape") render();
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) return;
  tasks.push({ id: "t" + Date.now(), text: val, done: false });
  save(tasks);
  input.value = "";
  render();
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.done);
  save(tasks);
  render();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    filter = tab.dataset.filter;
    render();
  });
});

render();
