/* ============================================================
   main.js — Lord Grimbo Portfolio
   Handles: Theme detection & toggling, future module stubs.
   ============================================================ */

/* ------------------------------------------------------------
   1. THEME MANAGEMENT
   Priority order:
     1. Saved preference in localStorage
     2. Browser's prefers-color-scheme media query
     3. Default: dark
   ------------------------------------------------------------ */

/**
 * Applies a theme to the <html> element and updates the
 * navbar toggle icon accordingly.
 * @param {string} theme - "dark" or "light"
 */
function applyTheme(theme) {
  const html       = document.documentElement;
  const toggleBtn  = document.getElementById('theme-toggle');
  const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

  // Set the data-theme attribute — CSS vars pick this up
  html.setAttribute('data-theme', theme);

  // Swap the icon: dark mode shows sun (to switch TO light),
  // light mode shows moon (to switch TO dark)
  if (toggleIcon) {
    if (theme === 'dark') {
      toggleIcon.className = 'bi bi-sun-fill';
      toggleBtn.setAttribute('aria-label', 'Switch to light mode');
      toggleBtn.setAttribute('title', 'Switch to light mode');
    } else {
      toggleIcon.className = 'bi bi-moon-fill';
      toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      toggleBtn.setAttribute('title', 'Switch to dark mode');
    }
  }
}

/**
 * Detects the preferred starting theme.
 * Checks localStorage first, then OS preference, then defaults to dark.
 * @returns {string} "dark" or "light"
 */
function detectTheme() {
  const saved = localStorage.getItem('grimbo-theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  // Check OS / browser preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  // Default to dark
  return 'dark';
}

/**
 * Toggles between dark and light, saves to localStorage.
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('grimbo-theme', next);
}

/* ------------------------------------------------------------
   2. INITIALIZATION
   Runs once the DOM is ready.
   ------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function () {

  /* --- Apply saved/detected theme immediately --- */
  applyTheme(detectTheme());

  /* --- Wire up the theme toggle button --- */
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  /* --- Back to top button --- */
  const topBtn = document.getElementById('btn-top');
  if (topBtn) {
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Active nav link highlighting ---
       Compares current page filename to nav link hrefs
       and adds an 'active' class for visual feedback.      */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav .nav-link[data-page]').forEach(function (link) {
    if (link.getAttribute('data-page') === currentPage) {
      link.classList.add('active-page');
    }
  });

});

/* ------------------------------------------------------------
   3. FUTURE MODULE STUBS
   These will be fleshed out in future commits when the
   corresponding pages are built.
   ------------------------------------------------------------ */

/**
 * TODO (gallery.js): Load gallery entries.
 * - Loop over content/gallery subfolders
 * - Fetch meta.json from each entry
 * - Render entry cards into the gallery grid
 * - Wire up modal viewer for full-size images + links
 */

/**
 * TODO (projects.js): Load project entries.
 * - Fetch project manifest from content/projects
 * - Render project cards into the projects page
 * - Populate the featured carousel on the landing page
 */

/**
 * TODO (blog.js): Load blog post entries.
 * - Fetch blog manifest from content/blogs
 * - Render full blog listing on the blog page
 * - Populate the recent posts table on the landing page
 */
