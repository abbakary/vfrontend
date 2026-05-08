// src/utils/encode.js

/**
 * Encode a numeric ID to a Base64 string for safe URL usage
 * @param {number|string} id
 * @returns {string}
 */
export function encodeId(id) {
  if (id === undefined || id === null) return "";
  // Convert to string and encode
  return btoa(String(id));
}

/**
 * Decode a Base64-encoded ID back to string/number
 * @param {string} encodedId
 * @returns {string}
 */
export function decodeId(encodedId) {
  if (!encodedId) return null;
  try {
    return atob(encodedId);
  } catch {
    return null;
  }
}
