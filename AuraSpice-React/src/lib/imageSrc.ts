const FALLBACK_MENU_IMAGE = '/og-image.jpg';

export function resolveImageSrc(raw?: string | null): string {
  if (!raw) {
    return FALLBACK_MENU_IMAGE;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return FALLBACK_MENU_IMAGE;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.?\//, '')}`;
}

export { FALLBACK_MENU_IMAGE };
