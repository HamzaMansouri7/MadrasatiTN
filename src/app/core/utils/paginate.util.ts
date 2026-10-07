/**
 * Pure pagination and window calculation utilities.
 */

export function paginate<T>(items: readonly T[] | T[], page: number, size: number): T[] {
  if (!items || !items.length || size <= 0) return [];
  const validPage = Math.max(1, page);
  const start = (validPage - 1) * size;
  return items.slice(start, start + size);
}

export function calculateTotalPages(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getPageNumbers(totalPages: number, currentPage: number, maxButtons = 5): number[] {
  if (totalPages <= 0) return [];
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, currentPage), total);
  const pages: number[] = [];

  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  const end = Math.min(total, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}
