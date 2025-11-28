export const escapeRegExpString = (string: string): string =>
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
