// All localStorage access for ShadeSense history lives here.
// Components must never call localStorage directly.

const KEY = 'shadesense_history';
const MAX_ENTRIES = 20;

/**
 * Retrieve all history entries (newest first).
 * @returns {object[]}
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a new analysis entry to history (prepended, capped at MAX_ENTRIES).
 * @param {object} entry  — must conform to the documented history schema
 */
export function addEntry(entry) {
  try {
    const existing = getHistory();
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // Storage quota or private mode — fail silently
  }
}

/**
 * Retrieve a single history entry by id.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getEntry(id) {
  return getHistory().find((e) => e.id === id);
}

/**
 * Remove all history entries.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
