/**
 * gallery-test.js — Lord Grimbo Portfolio
 *
 * DEVELOPMENT / TEST SCRIPT — Phase 1 verification only.
 * NOT intended for production use.
 *
 * Purpose:
 *   Exercises EntryManager._getValidEntries() and EntryManager._readMetaFile()
 *   for the 'gallery' entry type and prints the results to the browser console.
 *
 * How to run:
 *   Add the following tag to gallery.html temporarily, then open the page
 *   and inspect the browser console:
 *
 *     <script type="module" src="src/gallery-test.js"></script>
 *
 *   Remove the tag when Phase 1 testing is complete.
 */

import { EntryManager } from './entry-manager.js';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Small console group wrapper for readable output.
 * @param {string} label
 * @param {Function} fn
 */
function section(label, fn) {
  console.group(`%c${label}`, 'color: #ff6ec7; font-weight: bold;');
  fn();
  console.groupEnd();
}

// ----------------------------------------------------------------
// Main test routine
// ----------------------------------------------------------------

async function runGalleryTest() {
  console.log('%c[gallery-test.js] Starting Entry Manager gallery test…', 'color: #bea7cd;');

  // ------------------------------------------------------------------
  // STEP 1 — Fetch the list of valid entry paths from the gallery index.
  // ------------------------------------------------------------------
  let entryPaths;

  try {
    entryPaths = await EntryManager._getValidEntries('gallery');

    section('_getValidEntries("gallery") — Result', () => {
      console.log(`Found ${entryPaths.length} entry/entries:`);
      entryPaths.forEach((p, i) => console.log(`  [${i}] ${p}`));
    });

  } catch (err) {
    console.error('[gallery-test.js] _getValidEntries failed:', err.message);
    return; // Can't continue without paths.
  }

  if (entryPaths.length === 0) {
    console.warn('[gallery-test.js] Index returned zero entries. Nothing further to test.');
    return;
  }

  // ------------------------------------------------------------------
  // STEP 2 — Parse every meta.json and log the resolved objects.
  // ------------------------------------------------------------------
  section('_readMetaFile() — Parsed entries', () => {
    console.log('Fetching and parsing each meta.json…');
  });

  const results = await Promise.allSettled(
    entryPaths.map(path => EntryManager._readMetaFile(path, 'gallery'))
  );

  results.forEach((result, i) => {
    const path = entryPaths[i];

    if (result.status === 'fulfilled') {
      section(`Entry [${i}] — ${path}`, () => {
        console.log(result.value);

        // Spot-check: confirm top-level paths were resolved.
        const meta = result.value;
        console.log('  date   :', meta.uploadDate   ?? '(not present)');
        console.log('  iconPath   :', meta.iconPath   ?? '(not present)');
        console.log('  description:', meta.description ?? '(not present)');

        if (Array.isArray(meta.content)) {
          console.log(`  content (${meta.content.length} item/s):`);
          meta.content.forEach((c, j) => {
            console.log(`    [${j}] imgPath: ${c.imgPath ?? '(not present)'}  title: ${c.title ?? '(not present)'}`);
          });
        } else {
          console.log('  content: (not present or not an array)');
        }

        if (Array.isArray(meta.links)) {
          console.log(`  links (${meta.links.length} item/s):`);
          meta.links.forEach((l, j) => {
            console.log(`    [${j}] ${l.title ?? '?'} → ${l.link ?? '?'}`);
          });
        }
      });

    } else {
      console.error(`[gallery-test.js] _readMetaFile failed for "${path}":`, result.reason?.message ?? result.reason);
    }
  });

  // ------------------------------------------------------------------
  // STEP 3 — Verify that non-gallery types throw "Not Implemented".
  // ------------------------------------------------------------------
  section('"Not Implemented" guard test', () => {
    ['project', 'blog'].forEach(async type => {
      try {
        await EntryManager._getValidEntries(type);
        console.warn(`  ${type}: Expected a "Not Implemented" error but none was thrown. ⚠️`);
      } catch (err) {
        console.log(`  ${type}: Correctly threw → "${err.message}" ✓`);
      }
    });

    // Also test a completely unknown type.
    try {
      EntryManager._getValidEntries('unicorn');
      console.warn('  unicorn: Expected an "Unknown type" error but none was thrown. ⚠️');
    } catch (err) {
      console.log(`  unicorn: Correctly threw → "${err.message}" ✓`);
    }
  });

  console.log('%c[gallery-test.js] Test complete.', 'color: #bea7cd;');
}

// Run.
runGalleryTest();