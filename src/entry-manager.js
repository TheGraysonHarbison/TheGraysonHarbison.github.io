/**
 * entry-manager.js — Lord Grimbo Portfolio
 *
 * Centralized static utility for reading and parsing portfolio entries.
 * An "Entry" is any subfolder under a content section that contains a meta.json file.
 * Valid entry types: 'gallery' | 'project' | 'blog'
 *
 * All paths are relative to the project root.
 *
 * Usage:
 *   import { EntryManager } from './entry-manager.js';
 *   const paths = await EntryManager._getValidEntries('gallery');
 *   const meta  = await EntryManager._readMetaFile(paths[0], 'gallery');
 */

export class EntryManager {

  // ----------------------------------------------------------------
  // PRIVATE CONSTANTS — Root paths for each content section.
  // ----------------------------------------------------------------

  /** @type {Object.<string, {root: string, index: string}>} */
  static #CONTENT_PATHS = {
    gallery: {
      root:  'content/gallery/',
      index: 'content/gallery/index.json',
    },
    // Stubs — not yet implemented.
    project: {
      root:  'content/projects/',
      index: 'content/projects/index.json',
    },
    blog: {
      root:  'content/blogs/',
      index: 'content/blogs/index.json',
    },
  };

  /**
   * The meta.json fields whose values are file paths that must be resolved
   * to root-relative paths, keyed by entry type.
   *
   * For content arrays the keys refer to the field name inside each
   * array element object.
   *
   * Structure per type:
   *   topLevel   — string[] of top-level field names that are plain paths
   *   contentArray — { arrayField, pathKey }[] for paths nested in arrays
   *
   * @type {Object.<string, {topLevel: string[], contentArray: Array<{arrayField: string, pathKey: string}>}>}
   */
  static #PATH_FIELDS = {
    gallery: {
      topLevel:     ['iconPath', 'description'],
      contentArray: [{ arrayField: 'content', pathKey: 'imgPath' }],
    },
    // Stubs — populate when those entry types are implemented.
    project: null,
    blog:    null,
  };


  // ----------------------------------------------------------------
  // PUBLIC STATIC METHODS
  // ----------------------------------------------------------------

  /**
   * Reads the index.json for the given entry type and returns an array
   * of fully resolved paths to each entry's meta.json file.
   *
   * @param  {string}   entryType  One of 'gallery' | 'project' | 'blog'
   * @returns {Promise<string[]>}  Array of root-relative meta.json paths.
   *                               e.g. ["content/gallery/PickleJesus/meta.json", ...]
   * @throws  {Error}  If the entry type is not yet implemented, or the
   *                   index file cannot be fetched/parsed.
   */
  static async _getValidEntries(entryType) {
    EntryManager.#assertImplemented(entryType);

    const { root, index } = EntryManager.#CONTENT_PATHS[entryType];

    let indexData;
    try {
      const response = await fetch(index);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} — could not fetch index file at "${index}".`);
      }
      indexData = await response.json();
    } catch (err) {
      throw new Error(`EntryManager._getValidEntries: failed to load index for type "${entryType}". ${err.message}`);
    }

    // index.json shape: { entries: ["Subfolder1", "Subfolder2", ...] }
    if (!Array.isArray(indexData.entries)) {
      throw new Error(`EntryManager._getValidEntries: index.json for "${entryType}" is missing an "entries" array.`);
    }

    // Build full path to each entry's meta.json.
    return indexData.entries.map(folderName => `${root}${folderName}/meta.json`);
  }


  /**
   * Fetches and parses a meta.json file, correcting all relative file
   * paths inside it to root-relative paths based on the entry type.
   *
   * @param  {string} metaPath   Root-relative path to a meta.json file.
   *                             e.g. "content/gallery/PickleJesus/meta.json"
   * @param  {string} entryType  One of 'gallery' | 'project' | 'blog'
   * @returns {Promise<Object>}  Parsed meta object with all paths corrected.
   * @throws  {Error}  If the entry type is not yet implemented, or the
   *                   meta file cannot be fetched/parsed.
   */
  static async _readMetaFile(metaPath, entryType) {
    EntryManager.#assertImplemented(entryType);

    let meta;
    try {
      const response = await fetch(metaPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} — could not fetch meta file at "${metaPath}".`);
      }
      meta = await response.json();
    } catch (err) {
      throw new Error(`EntryManager._readMetaFile: failed to load "${metaPath}". ${err.message}`);
    }

    // Derive the entry's folder root from the meta.json path.
    // e.g. "content/gallery/PickleJesus/meta.json" → "content/gallery/PickleJesus/"
    const entryRoot = EntryManager.#getEntryRoot(metaPath);

    // Resolve paths according to the field map for this entry type.
    const pathFields = EntryManager.#PATH_FIELDS[entryType];
    const resolved   = { ...meta };

    // --- Top-level path fields ---
    for (const field of pathFields.topLevel) {
      if (typeof resolved[field] === 'string' && resolved[field].length > 0) {
        resolved[field] = entryRoot + resolved[field];
      }
    }

    // --- Paths nested inside content arrays ---
    for (const { arrayField, pathKey } of pathFields.contentArray) {
      if (Array.isArray(resolved[arrayField])) {
        resolved[arrayField] = resolved[arrayField].map(item => {
          if (typeof item[pathKey] === 'string' && item[pathKey].length > 0) {
            return { ...item, [pathKey]: entryRoot + item[pathKey] };
          }
          return item;
        });
      }
    }

    console.log(resolved);
    return resolved;
  }


  // ----------------------------------------------------------------
  // PRIVATE HELPERS
  // ----------------------------------------------------------------

  /**
   * Throws a "Not Implemented" error if the entry type is valid but
   * has no implementation yet, or an "Unknown type" error if unrecognised.
   *
   * @param {string} entryType
   */
  static #assertImplemented(entryType) {
    const known = Object.keys(EntryManager.#CONTENT_PATHS);

    if (!known.includes(entryType)) {
      throw new Error(`EntryManager: Unknown entry type "${entryType}". Valid types are: ${known.join(', ')}.`);
    }

    // 'gallery' is the only fully implemented type in this commit.
    if (entryType !== 'gallery') {
      throw new Error(`EntryManager: Entry type "${entryType}" is not yet implemented.`);
    }
  }


  /**
   * Derives the root folder path of an entry from its meta.json path.
   * Always returns a string ending in '/'.
   *
   * @param  {string} metaPath  e.g. "content/gallery/PickleJesus/meta.json"
   * @returns {string}          e.g. "content/gallery/PickleJesus/"
   */
  static #getEntryRoot(metaPath) {
    const lastSlash = metaPath.lastIndexOf('/');
    return lastSlash >= 0 ? metaPath.slice(0, lastSlash + 1) : '';
  }

}