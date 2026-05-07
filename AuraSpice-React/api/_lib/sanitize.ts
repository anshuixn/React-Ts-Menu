/**
 * sanitize.ts — XSS-safe string sanitization for all DB writes.
 * Applied to every freeform string field before any Supabase insert/update.
 */
import xss, { type IFilterXSSOptions } from 'xss';

const xssOptions: IFilterXSSOptions = {
  whiteList: {},           // Allow zero HTML tags
  stripIgnoreTag: true,    // Strip disallowed tags completely
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'noscript'],
};

/**
 * Sanitize a single string — strips all HTML/script content,
 * normalizes whitespace, and trims.
 */
export function sanitizeString(input: string): string {
  return xss(input, xssOptions).replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize a string and enforce max length.
 * Returns null if the result is empty after sanitization.
 */
export function sanitizeAndLimit(input: string, maxLength: number): string | null {
  const clean = sanitizeString(input);
  if (clean.length === 0) return null;
  return clean.slice(0, maxLength);
}
