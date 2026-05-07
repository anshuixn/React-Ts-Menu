import { describe, expect, it } from 'vitest';
import { FALLBACK_MENU_IMAGE, resolveImageSrc } from './imageSrc';

describe('resolveImageSrc', () => {
  it('returns fallback for empty image values', () => {
    expect(resolveImageSrc('')).toBe(FALLBACK_MENU_IMAGE);
    expect(resolveImageSrc('   ')).toBe(FALLBACK_MENU_IMAGE);
    expect(resolveImageSrc(null)).toBe(FALLBACK_MENU_IMAGE);
    expect(resolveImageSrc(undefined)).toBe(FALLBACK_MENU_IMAGE);
  });

  it('keeps supported absolute and root-relative URLs unchanged', () => {
    expect(resolveImageSrc('https://cdn.example.com/item.png')).toBe('https://cdn.example.com/item.png');
    expect(resolveImageSrc('http://cdn.example.com/item.png')).toBe('http://cdn.example.com/item.png');
    expect(resolveImageSrc('/assets/menu/item.png')).toBe('/assets/menu/item.png');
    expect(resolveImageSrc('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
  });

  it('normalizes relative paths to root-relative URLs', () => {
    expect(resolveImageSrc('assets/menu/item.png')).toBe('/assets/menu/item.png');
    expect(resolveImageSrc('./assets/menu/item.png')).toBe('/assets/menu/item.png');
  });
});
