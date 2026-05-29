import { describe, expect, it } from 'vitest';
import { sanitizeString, sanitizeAndLimit } from './sanitize.js';

describe('sanitize — sanitizeString', () => {
  it('strips HTML tags and script content completely', () => {
    const input = 'Hello <script>alert("hack")</script> <b>World</b>!';
    const expected = 'Hello World!';
    expect(sanitizeString(input)).toBe(expected);
  });

  it('normalizes multiple spaces and tabs to a single space', () => {
    const input = '  Hello   World!  This    is   a test.   ';
    const expected = 'Hello World! This is a test.';
    expect(sanitizeString(input)).toBe(expected);
  });

  it('handles empty strings or inputs with only whitespace', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString('   \n  \t   ')).toBe('');
  });

  it('strips dangerous tags like style, iframe, and noscript', () => {
    const input = 'Check <iframe src="http://evil.com"></iframe> this <style>body { color: red; }</style> out!';
    const expected = 'Check this out!';
    expect(sanitizeString(input)).toBe(expected);
  });
});

describe('sanitize — sanitizeAndLimit', () => {
  it('returns null if empty after sanitization', () => {
    expect(sanitizeAndLimit('   ', 10)).toBeNull();
    expect(sanitizeAndLimit('<script>dangerous</script>', 10)).toBeNull();
  });

  it('truncates clean text to the specified max length', () => {
    const input = 'This is a long string that should be cut short';
    expect(sanitizeAndLimit(input, 10)).toBe('This is a ');
  });

  it('returns the full string if length is within limit', () => {
    const input = 'short';
    expect(sanitizeAndLimit(input, 10)).toBe('short');
  });
});
