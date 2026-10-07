import { paginate, calculateTotalPages, getPageNumbers } from './paginate.util';

describe('paginate.util', () => {
  describe('paginate()', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('returns empty array when list is empty or size is invalid', () => {
      expect(paginate([], 1, 5)).toEqual([]);
      expect(paginate(list, 1, 0)).toEqual([]);
      expect(paginate(list, 1, -1)).toEqual([]);
    });

    it('returns first page items', () => {
      expect(paginate(list, 1, 3)).toEqual([1, 2, 3]);
    });

    it('returns middle page items', () => {
      expect(paginate(list, 2, 3)).toEqual([4, 5, 6]);
    });

    it('returns remaining items on last partial page', () => {
      expect(paginate(list, 4, 3)).toEqual([10]);
    });

    it('returns empty array when page is out of bounds', () => {
      expect(paginate(list, 5, 3)).toEqual([]);
    });

    it('clamps negative or zero page to page 1', () => {
      expect(paginate(list, 0, 3)).toEqual([1, 2, 3]);
      expect(paginate(list, -2, 3)).toEqual([1, 2, 3]);
    });
  });

  describe('calculateTotalPages()', () => {
    it('returns 1 when total is 0 or negative', () => {
      expect(calculateTotalPages(0, 10)).toBe(1);
      expect(calculateTotalPages(-5, 10)).toBe(1);
    });

    it('calculates total pages correctly', () => {
      expect(calculateTotalPages(10, 5)).toBe(2);
      expect(calculateTotalPages(11, 5)).toBe(3);
      expect(calculateTotalPages(1, 5)).toBe(1);
    });
  });

  describe('getPageNumbers()', () => {
    it('returns empty array when totalPages is 0 or negative', () => {
      expect(getPageNumbers(0, 1)).toEqual([]);
      expect(getPageNumbers(-1, 1)).toEqual([]);
    });

    it('returns [1] when totalPages is 1', () => {
      expect(getPageNumbers(1, 1)).toEqual([1]);
    });

    it('returns all pages when totalPages <= maxButtons', () => {
      expect(getPageNumbers(3, 1)).toEqual([1, 2, 3]);
      expect(getPageNumbers(3, 2)).toEqual([1, 2, 3]);
      expect(getPageNumbers(3, 3)).toEqual([1, 2, 3]);
    });

    it('returns first window when current page is at the start', () => {
      expect(getPageNumbers(10, 1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPageNumbers(10, 2, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPageNumbers(10, 3, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('shifts window when current page moves into the middle', () => {
      expect(getPageNumbers(10, 4, 5)).toEqual([2, 3, 4, 5, 6]);
      expect(getPageNumbers(10, 5, 5)).toEqual([3, 4, 5, 6, 7]);
    });

    it('clamps window to the end when current page is near the last page', () => {
      expect(getPageNumbers(10, 9, 5)).toEqual([6, 7, 8, 9, 10]);
      expect(getPageNumbers(10, 10, 5)).toEqual([6, 7, 8, 9, 10]);
    });
  });
});
