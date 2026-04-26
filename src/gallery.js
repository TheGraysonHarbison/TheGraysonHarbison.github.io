// src/gallery.js — Lord Grimbo Portfolio
//
// Reads content/gallery/index.json and logs every entry's
// meta.json data to the console.
//
// This is the initial stub. Rendering logic will be built
// on top of this foundation in a future commit.

const GALLERY_INDEX = "content/gallery/index.json";
const GALLERY_ROOT  = "content/gallery";

// ------------------------------------------------------------
// fetchGalleryEntries
// Fetches index.json, then fetches meta.json for each entry.
// Returns an array of { name, meta } objects.
// ------------------------------------------------------------
async function fetchGalleryEntries() {
  // 1. Load the index
  let index;
  try {
    const res = await fetch(GALLERY_INDEX);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    index = await res.json();
  } catch (err) {
    console.error("[gallery] Failed to load index.json:", err);
    return [];
  }

  const entryNames = index.entries ?? [];
  if (entryNames.length === 0) {
    console.warn("[gallery] index.json has no entries.");
    return [];
  }

  // 2. Fetch meta.json for each entry in parallel
  const results = await Promise.allSettled(
    entryNames.map(async (name) => {
        console.log(name);
      const metaUrl = `${GALLERY_ROOT}/${name}/meta.json`;
      const res = await fetch(metaUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const meta = await res.json();
      return { name, meta };
    })
  );

  // 3. Separate successes from failures
  const entries = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      entries.push(result.value);
    } else {
      console.warn("[gallery] Failed to load an entry:", result.reason);
    }
  }

  return entries;
}

// ------------------------------------------------------------
// printGalleryEntries
// Logs each entry to the console in a readable format.
// ------------------------------------------------------------
function printGalleryEntries(entries) {
  if (entries.length === 0) {
    console.log("[gallery] No entries to display.");
    return;
  }

  console.log(`[gallery] ${entries.length} entries found:\n`);

  for (const { name, meta } of entries) {
    console.group(`📁 ${name}`);
    console.log("Title:      ", meta.title       ?? "(no title)");
    console.log("Icon:       ", meta.iconPath     ?? "(no icon)");
    console.log("Description:", meta.description  ?? "(no description)");
    console.log("Content:    ", meta.content      ?? []);
    console.log("Links:      ", meta.links        ?? []);
    console.groupEnd();
  }
}

// ------------------------------------------------------------
// init
// Entry point — called on DOMContentLoaded.
// ------------------------------------------------------------
async function init() {
  console.log("[gallery] Initializing...");
  const entries = await fetchGalleryEntries();
  printGalleryEntries(entries);
}

document.addEventListener("DOMContentLoaded", init);