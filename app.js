/* ==========================================================
   Dev Vault — Phase 2: Web app
   ==========================================================
   Reuses the exact detectCategory() and createEntry() logic
   from detect.js (copied below so the browser can run it).
   ========================================================== */

// ==========================================================
// 1. DETECTION LOGIC (copied from detect.js — same logic)
// ==========================================================

/**
 * Given raw content text, return a category string:
 *   "link" | "api_key" | "code_snippet" | "generic_api" | "note"
 */
function detectCategory(content) {
  // --- URL detection ---
  if (content.startsWith("http://") || content.startsWith("https://")) {
    return "link";
  }

  // --- API key detection ---
  const apiKeyPrefixes = [
    "sk-",
    "ghp_",
    "gho_",
    "AIza",
    "pk-",
    "ak-",
    "sk_live",
    "sk_test",
  ];
  const hasKnownPrefix = apiKeyPrefixes.some((prefix) =>
    content.startsWith(prefix),
  );
  if (hasKnownPrefix) {
    return "api_key";
  }

  // --- Code snippet detection ---
  const codeSnippetIndicators = [
    "function",
    "const",
    "let",
    "var",
    "class",
    "import",
    "export",
    "{",
    "}",
    ";",
    "style",
    "stylesheet",
    "head",
    "body",
    "html",
    "meta",
    "title",
    "script",
  ];
  const hasCodeSnippetIndicator = codeSnippetIndicators.some((indicator) =>
    content.includes(indicator),
  );
  if (hasCodeSnippetIndicator) {
    return "code_snippet";
  }

  // --- Generic API detection ---
  const punctuation = [".", ",", "?", "!"];
  const hasNoPunctuation = punctuation.every((char) => !content.includes(char));
  const hasNoSpaces = !content.includes(" ");
  const isLongEnough = content.length > 25 && content.length < 1000;

  const isGenericApi = isLongEnough && hasNoSpaces && hasNoPunctuation;
  if (isGenericApi) {
    return "generic_api";
  }
  return "note";
}

/**
 * Create an entry object from content + project name.
 * Returns: { content, category, project, createdAt, time }
 */
function createEntry(content, project) {
  const category = detectCategory(content);
  const now = new Date();
  const entry = {
    content: content,
    category: category,
    project: project,
    createdAt: now.toISOString(),
    time: now.toLocaleTimeString(),
  };
  return entry;
}

// ==========================================================
// 2. STATE
// ==========================================================

// The master array of all entries (the "source of truth").
let entries = [];

// The currently-active filter value. "all" means show everything.
let currentFilter = "all";

// ==========================================================
// 3. DOM REFERENCES (cached once at the top)
// ==========================================================

const form = document.getElementById("entry-form");
const projectInput = document.getElementById("project-input");
const contentInput = document.getElementById("content-input");
const entryList = document.getElementById("entry-list");
const emptyState = document.getElementById("empty-state");
const filterEmptyState = document.getElementById("filter-empty-state");
const filterButtons = document.querySelectorAll(".filter-btn");

// ==========================================================
// 4. LOCALSTORAGE HELPERS
// ==========================================================

/**
 * localStorage is a built-in browser key-value store.
 * - Values are always strings.
 * - JSON.stringify() converts our array to a JSON string.
 * - JSON.parse() converts it back to a live array.
 */
const STORAGE_KEY = "devVaultEntries";

/** Load entries from localStorage. Returns an array (empty if none). */
function loadFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    // Nothing saved yet — return an empty array
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    // If the JSON is somehow corrupted, start fresh
    return [];
  }
}

/** Save the current entries array to localStorage. */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ==========================================================
// 5. RENDER
// ==========================================================

/**
 * Build the category label we show in the badge.
 * Maps the internal category string to a human-readable name.
 */
function categoryLabel(category) {
  const labels = {
    link: "Link",
    api_key: "API Key",
    code_snippet: "Code Snippet",
    generic_api: "Generic API",
    note: "Note",
  };
  return labels[category] || category;
}

/**
 * Render the entry list based on the current filter.
 *
 * Steps:
 *   1. Decide which entries to show (filter if needed).
 *   2. Loop over them and build HTML for each card.
 *   3. Insert that HTML into the page.
 *   4. Show/hide the empty-state messages.
 */
function render() {
  // --- Filter logic ---
  let visibleEntries;
  if (currentFilter === "all") {
    visibleEntries = entries;
  } else {
    // Only keep entries whose category matches the filter
    visibleEntries = entries.filter(
      (entry) => entry.category === currentFilter,
    );
  }

  // --- Build the HTML string for all visible entries ---
  let html = "";

  for (let i = 0; i < visibleEntries.length; i++) {
    const entry = visibleEntries[i];

    // We need the index in the MASTER `entries` array so the delete
    // button knows which one to remove. Find it with indexOf().
    const masterIndex = entries.indexOf(entry);

    // Each card is a <div> with a data-index attribute so we can
    // find it later for deletion.  We also embed the index in the
    // delete button's onclick handler (a simple approach for v1).
    html += `
      <div class="entry-card" data-index="${masterIndex}">
        <button
          class="delete-btn"
          onclick="deleteEntry(${masterIndex})"
          title="Delete entry"
        >&times;</button>

        <div class="category-badge category-${entry.category}">
          ${categoryLabel(entry.category)}
        </div>

        <div class="entry-content">${escapeHtml(entry.content)}</div>

        <div class="entry-meta">
          <span class="entry-project">${escapeHtml(entry.project)}</span>
          <span class="entry-time">${entry.time}</span>
        </div>
      </div>
    `;
  }

  // Insert the HTML into the list container
  entryList.innerHTML = html;

  // --- Empty-state messages ---
  if (entries.length === 0) {
    // Nothing saved at all
    emptyState.classList.remove("hidden");
    filterEmptyState.classList.add("hidden");
  } else if (visibleEntries.length === 0) {
    // Entries exist, but none match the current filter
    emptyState.classList.add("hidden");
    filterEmptyState.classList.remove("hidden");
  } else {
    // We have visible entries — hide both empty states
    emptyState.classList.add("hidden");
    filterEmptyState.classList.add("hidden");
  }
}

/**
 * Escape special HTML characters to prevent XSS if someone pastes
 * something like <script> into the content.  This turns < into
 * &lt; etc. so the browser displays it as text, not markup.
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ==========================================================
// 6. ACTIONS (Save / Delete / Filter)
// ==========================================================

/** Handle the form submit — create an entry and save it. */
function handleSave(event) {
  event.preventDefault(); // Stop the browser from reloading the page

  const project = projectInput.value.trim();
  const content = contentInput.value.trim();

  if (!project || !content) {
    return; // shouldn't happen with "required" on the inputs, but guard
  }

  // Create the entry using the same logic as detect.js
  const entry = createEntry(content, project);

  // Add it to the master array
  entries.push(entry);

  // Persist to localStorage
  saveToStorage();

  // Re-render the list (includes filter logic)
  render();

  // Clear the form so the user can paste something else quickly
  contentInput.value = "";
  projectInput.value = "";
  projectInput.focus();
}

/**
 * Delete an entry by its index in the master `entries` array.
 * This is called from the onclick handler in each entry card.
 */
function deleteEntry(index) {
  // Remove one item at the given index
  entries.splice(index, 1);

  // Persist the updated array
  saveToStorage();

  // Re-render
  render();
}

/** Switch the current filter and re-render. */
function setFilter(filter) {
  currentFilter = filter;

  // Update the active class on filter buttons so the user sees
  // which one is selected
  filterButtons.forEach((btn) => {
    if (btn.dataset.filter === filter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  render();
}

// ==========================================================
// 7. EVENT LISTENERS
// ==========================================================

// Save button — listen for the form's "submit" event
form.addEventListener("submit", handleSave);

// Filter buttons
filterButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    setFilter(this.dataset.filter);
  });
});

// ==========================================================
// 8. BOOTSTRAP (run on page load)
// ==========================================================

// Load any saved entries from localStorage
entries = loadFromStorage();

// Render them into the page
render();
