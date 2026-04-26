export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[äÄ]/g, 'a')
    .replace(/[õÕ]/g, 'o')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
