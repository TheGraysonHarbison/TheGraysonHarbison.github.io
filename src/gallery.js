/**
 * gallery.js — Lord Grimbo Portfolio
 *
 * Drives the Gallery page (gallery.html).
 * Imports shared site behaviour from main.js and gallery entry data
 * from the EntryManager module.
 *
 * Responsibilities:
 *   1. On page load, fetch all gallery entries via EntryManager.
 *   2. Sort entries by uploadDate descending (newest first).
 *   3. Build and inject .gallery-item tiles into #gallery-grid.
 *   4. Show #gallery-empty state if no entries are found.
 *   5. On tile click, populate and open #galleryDetailModal with the
 *      entry's carousel slides, title, date, description and links.
 *
 * Dependencies:
 *   - src/main.js        (theme toggle, back-to-top — side effects only)
 *   - src/entry-manager.js
 *   - Bootstrap 5 JS    (loaded as a CDN <script> in gallery.html)
 */

// ── Shared site behaviour (theme toggle, back-to-top). ──────────────────────
// main.js is a non-module script in the original project, so we import it
// here as a side-effect-only module. If main.js is ever converted to an ES
// module, this import still works cleanly.
import './main.js';

// ── Entry data pipeline. ─────────────────────────────────────────────────────
import { EntryManager } from './entry-manager.js';


// ============================================================
// SECTION 1 — SOCIAL LINK CONFIGURATION
// Maps the `title` field from a links[] entry in meta.json to
// the correct Bootstrap Icon class and a human-readable label.
// Only platforms listed here will render an icon button.
// ============================================================

/**
 * @type {Object.<string, {icon: string, label: string}>}
 * Keys are lowercase and match what gallery authors write in meta.json.
 */
const SOCIAL_ICON_MAP = {
  twitter:  { icon: 'bi-twitter-x',  label: 'Twitter / X'  },
  bluesky:  { icon: 'bi-cloud-fill',  label: 'Bluesky'      }, // BI has no Bluesky icon yet.
  youtube:  { icon: 'bi-youtube',     label: 'YouTube'      },
  behance:  { icon: 'bi-behance',     label: 'Behance'      },
  linkedin: { icon: 'bi-linkedin',    label: 'LinkedIn'     },
  github:   { icon: 'bi-github',      label: 'GitHub'       },
};


// ============================================================
// SECTION 2 — DOM REFERENCES
// Cached once on load. All render functions use these.
// ============================================================

/** @type {HTMLElement} The 3-column grid that holds all gallery tiles. */
const galleryGrid  = document.getElementById('gallery-grid');

/** @type {HTMLElement} Empty-state block shown when there are no entries. */
const galleryEmpty = document.getElementById('gallery-empty');

// Detail modal inner elements — populated per-entry on tile click.
/** @type {HTMLElement} */ const detailTitle      = document.getElementById('galleryDetailModalLabel');
/** @type {HTMLElement} */ const detailDate       = document.getElementById('galleryDetailDate');
/** @type {HTMLElement} */ const detailDesc       = document.getElementById('galleryDetailDesc');
/** @type {HTMLElement} */ const detailLinks      = document.getElementById('galleryDetailLinks');
/** @type {HTMLElement} */ const detailSlides     = document.getElementById('galleryDetailSlides');
/** @type {HTMLElement} */ const detailIndicators = document.getElementById('galleryDetailIndicators');

/** @type {HTMLElement} The Bootstrap modal root element. */
const detailModalEl = document.getElementById('galleryDetailModal');


// ============================================================
// SECTION 3 — ENTRY LOADING & SORTING
// Fetches all gallery entries through EntryManager and returns
// them sorted by uploadDate descending (newest first).
// ============================================================

/**
 * Fetches and returns all gallery entry meta objects, sorted newest first.
 * Entries that fail to load are skipped with a console warning rather than
 * aborting the whole page.
 *
 * @returns {Promise<Object[]>} Array of resolved, sorted meta objects.
 */
async function loadGalleryEntries() {
  let paths;
  try {
    paths = await EntryManager._getValidEntries('gallery');
  } catch (err) {
    console.error('gallery.js: Could not read gallery index.', err.message);
    return [];
  }

  if (paths.length === 0) return [];

  // Attempt to parse every entry; collect successes only.
  const results = await Promise.allSettled(
    paths.map(p => EntryManager._readMetaFile(p, 'gallery'))
  );

  const entries = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      entries.push(result.value);
    } else {
      console.warn(`gallery.js: Skipped entry at "${paths[i]}" — ${result.reason?.message}`);
    }
  });

  // Sort by uploadDate descending. Entries without a date sort to the end.
  entries.sort((a, b) => {
    const dateA = a.uploadDate ? new Date(a.uploadDate) : new Date(0);
    const dateB = b.uploadDate ? new Date(b.uploadDate) : new Date(0);
    return dateB - dateA;
  });

  return entries;
}


// ============================================================
// SECTION 4 — GALLERY GRID RENDERING
// Builds .gallery-item tiles and injects them into #gallery-grid.
// Each tile shows the entry's icon image with a hover title overlay.
// ============================================================

/**
 * Builds a single gallery tile element for one entry.
 * The tile is keyboard-focusable and fires the detail modal on activation.
 *
 * @param   {Object} entry  Parsed meta object from EntryManager._readMetaFile.
 * @param   {number} index  Position in the sorted entries array (for ARIA labels).
 * @returns {HTMLElement}   A .gallery-item <div> ready to insert into the grid.
 */
function buildGalleryTile(entry, index) {
  /*
   * Tile structure:
   *
   *  <div class="gallery-item" role="listitem" tabindex="0">
   *    <div class="gallery-item-img-wrap">
   *      <img class="gallery-item-img" src="..." alt="..." />
   *      <div class="gallery-item-overlay">
   *        <span class="gallery-item-title">...</span>
   *      </div>
   *    </div>
   *  </div>
   */

  const tile = document.createElement('div');
  tile.className  = 'gallery-item';
  tile.setAttribute('role', 'listitem');
  tile.setAttribute('tabindex', '0');
  tile.setAttribute('aria-label', `Open gallery entry: ${entry.title ?? `Entry ${index + 1}`}`);

  // Image wrapper — contains the icon image and hover overlay.
  const imgWrap = document.createElement('div');
  imgWrap.className = 'gallery-item-img-wrap';

  // Icon image.
  const img = document.createElement('img');
  img.className = 'gallery-item-img';
  img.src       = entry.iconPath ?? '';
  img.alt       = entry.title   ?? `Gallery entry ${index + 1}`;
  img.loading   = 'lazy'; // Defer off-screen images for performance.

  // Hover overlay — solid background + title text.
  const overlay = document.createElement('div');
  overlay.className   = 'gallery-item-overlay';
  overlay.setAttribute('aria-hidden', 'true'); // Title is on the tile itself via aria-label.

  const titleSpan = document.createElement('span');
  titleSpan.className   = 'gallery-item-title';
  titleSpan.textContent = entry.title ?? 'Untitled';

  overlay.appendChild(titleSpan);
  imgWrap.appendChild(img);
  imgWrap.appendChild(overlay);
  tile.appendChild(imgWrap);

  // ── Open detail modal on click or Enter/Space keypress. ─────────────────
  tile.addEventListener('click', () => openDetailModal(entry));
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetailModal(entry);
    }
  });

  return tile;
}

/**
 * Renders all entry tiles into #gallery-grid.
 * Marks the grid as no longer busy once done.
 *
 * @param {Object[]} entries  Sorted array of resolved meta objects.
 */
function renderGalleryGrid(entries) {
  galleryGrid.innerHTML = ''; // Clear any previous content or loading state.

  entries.forEach((entry, i) => {
    galleryGrid.appendChild(buildGalleryTile(entry, i));
  });

  // Signal to screen readers that the live region has finished loading.
  galleryGrid.setAttribute('aria-busy', 'false');
}


// ============================================================
// SECTION 5 — EMPTY STATE
// Shown when the gallery index returns zero valid entries.
// ============================================================

/**
 * Hides the gallery grid and reveals the empty-state block.
 */
function showEmptyState() {
  galleryGrid.hidden  = true;
  galleryGrid.setAttribute('aria-hidden', 'true');
  galleryEmpty.hidden = false;
  galleryEmpty.removeAttribute('aria-hidden');
}


// ============================================================
// SECTION 6 — GALLERY DETAIL MODAL
// Populates the shared #galleryDetailModal skeleton with one
// entry's data, then opens it via Bootstrap's modal API.
// ============================================================

/**
 * Builds and injects carousel slides + indicators for one entry.
 * Resets the carousel to slide 0 each time a new entry is opened.
 *
 * @param {Object[]} contentItems  entry.content array from meta.json.
 *                                 Each item: { imgPath: string, title: string }
 */
function _buildCarousel(contentItems) {
  detailSlides.innerHTML     = '';
  detailIndicators.innerHTML = '';

  if (!Array.isArray(contentItems) || contentItems.length === 0) {
    // No content images — show a placeholder slide.
    const placeholder = document.createElement('div');
    placeholder.className = 'carousel-item active';
    placeholder.innerHTML = `
      <div class="gallery-detail-no-img" role="img" aria-label="No images available">
        [ No images ]
      </div>`;
    detailSlides.appendChild(placeholder);
    return;
  }

  contentItems.forEach((item, i) => {
    // ── Indicator dot ────────────────────────────────────────────────────────
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.setAttribute('data-bs-target', '#galleryDetailCarousel');
    indicator.setAttribute('data-bs-slide-to', String(i));
    indicator.setAttribute('aria-label', `Go to image ${i + 1}`);
    if (i === 0) {
      indicator.classList.add('active');
      indicator.setAttribute('aria-current', 'true');
    }
    detailIndicators.appendChild(indicator);

    // ── Slide ────────────────────────────────────────────────────────────────
    const slide = document.createElement('div');
    slide.className = `carousel-item${i === 0 ? ' active' : ''}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `Image ${i + 1} of ${contentItems.length}: ${item.title ?? ''}`);

    const img = document.createElement('img');
    img.className = 'gallery-detail-slide-img';
    img.src       = item.imgPath ?? '';
    img.alt       = item.title  ?? `Image ${i + 1}`;
    img.loading   = 'lazy';

    // Show image title as a caption if one is provided.
    if (item.title) {
      const caption = document.createElement('div');
      caption.className   = 'carousel-caption gallery-detail-caption';
      caption.textContent = item.title;
      slide.appendChild(img);
      slide.appendChild(caption);
    } else {
      slide.appendChild(img);
    }

    detailSlides.appendChild(slide);
  });
}

/**
 * Builds and injects social link icon buttons into the info panel.
 * Only renders platforms present in SOCIAL_ICON_MAP.
 * Renders nothing if links[] is absent or empty.
 *
 * @param {Array<{link: string, title: string}>} links  entry.links from meta.json.
 */
function _buildSocialLinks(links) {
  detailLinks.innerHTML = '';

  if (!Array.isArray(links) || links.length === 0) return;

  const validLinks = links.filter(l => SOCIAL_ICON_MAP[l.title?.toLowerCase()]);
  if (validLinks.length === 0) return;

  // Section label above the icons.
  const label = document.createElement('p');
  label.className   = 'contact-label';
  label.textContent = 'Find It Online';
  detailLinks.appendChild(label);

  // Icon button row — reuses .social-icons / .social-icon-link from style.css.
  const row = document.createElement('div');
  row.className = 'social-icons';

  validLinks.forEach(linkObj => {
    const key  = linkObj.title.toLowerCase();
    const meta = SOCIAL_ICON_MAP[key];

    const anchor = document.createElement('a');
    anchor.href             = linkObj.link;
    anchor.className        = 'social-icon-link';
    anchor.target           = '_blank';
    anchor.rel              = 'noopener noreferrer';
    anchor.setAttribute('role',       'listitem');
    anchor.setAttribute('aria-label', `${meta.label} (opens in new tab)`);
    anchor.setAttribute('title',       meta.label);

    anchor.innerHTML = `<i class="bi ${meta.icon}" aria-hidden="true"></i>`;
    row.appendChild(anchor);
  });

  detailLinks.setAttribute('role', 'list');
  detailLinks.appendChild(row);
}

/**
 * Fetches the plain-text description from the corrected desc.txt path.
 * Returns an empty string on failure so the modal still opens.
 *
 * @param   {string} descPath  Root-relative path to desc.txt.
 * @returns {Promise<string>}
 */
async function _fetchDescription(descPath) {
  if (!descPath) return '';
  try {
    const res = await fetch(descPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`gallery.js: Could not load description at "${descPath}". ${err.message}`);
    return '';
  }
}

/**
 * Populates the #galleryDetailModal with one entry's data and opens it.
 *
 * @param {Object} entry  Resolved meta object from EntryManager._readMetaFile.
 */
async function openDetailModal(entry) {
  // ── Reset carousel to avoid stale state from a previous entry. ──────────
  // Destroy and re-initialise the Bootstrap Carousel instance so slide
  // position always resets to 0 when a new entry is opened.
  const carouselEl = document.getElementById('galleryDetailCarousel');
  const existingCarousel = bootstrap.Carousel.getInstance(carouselEl);
  if (existingCarousel) existingCarousel.dispose();

  // ── Populate static text fields. ────────────────────────────────────────
  detailTitle.textContent = entry.title ?? 'Untitled';
  detailDate.textContent  = entry.uploadDate
    ? new Date(entry.uploadDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : 'Unknown date';

  // ── Build carousel slides. ───────────────────────────────────────────────
  _buildCarousel(entry.content);

  // ── Fetch and set description text. ─────────────────────────────────────
  const descText = await _fetchDescription(entry.description);
  detailDesc.textContent = descText || '(No description provided.)';

  // ── Build social link buttons. ───────────────────────────────────────────
  _buildSocialLinks(entry.links);

  // ── Initialise Bootstrap Carousel on the freshly populated slides. ──────
  new bootstrap.Carousel(carouselEl, { ride: false, wrap: true });

  // ── Open the modal. ──────────────────────────────────────────────────────
  const modal = bootstrap.Modal.getOrCreateInstance(detailModalEl);
  modal.show();
}


// ============================================================
// SECTION 7 — PAGE INITIALISATION
// Entry point: called once on DOMContentLoaded.
// ============================================================

/**
 * Initialises the gallery page.
 * Loads entries, renders the grid (or empty state), and wires up the modal.
 */
async function initGallery() {
  const entries = await loadGalleryEntries();

  if (entries.length === 0) {
    showEmptyState();
    return;
  }

  renderGalleryGrid(entries);
}

// Kick off once the DOM is ready.
document.addEventListener('DOMContentLoaded', initGallery);