import { describe, it, expect } from 'vitest';
import { formatNumberTR, parseDecimalFlexible } from '../src/lib/format';

describe('formatNumberTR', () => {
    it('should format number with Turkish locale - thousands separator', () => {
        expect(formatNumberTR(1000)).toBe('1.000,00');
        expect(formatNumberTR(10000)).toBe('10.000,00');
        expect(formatNumberTR(100000)).toBe('100.000,00');
    });

    it('should format decimal numbers correctly', () => {
        expect(formatNumberTR(1234.56)).toBe('1.234,56');
        expect(formatNumberTR(999.99)).toBe('999,99');
    });

    it('should handle zero and negative numbers', () => {
        expect(formatNumberTR(0)).toBe('0,00');
        expect(formatNumberTR(-1000)).toBe('-1.000,00');
    });
});

describe('parseDecimalFlexible', () => {
    it('should parse Turkish formatted numbers', () => {
        expect(parseDecimalFlexible('1.000,50')).toBe(1000.50);
        expect(parseDecimalFlexible('1000,50')).toBe(1000.50);
        expect(parseDecimalFlexible('1.234,56')).toBe(1234.56);
    });

    it('should parse standard number format', () => {
        expect(parseDecimalFlexible('1000.50')).toBe(1000.50);
        expect(parseDecimalFlexible('1234.56')).toBe(1234.56);
    });

    it('should handle edge cases', () => {
        expect(parseDecimalFlexible('0')).toBe(0);
        expect(parseDecimalFlexible('')).toBeNull();
    });
});
