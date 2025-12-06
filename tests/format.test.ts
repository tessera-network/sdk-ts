import { describe, it, expect } from 'vitest';
import {
  bytesToHex,
  hexToBytes,
  isValidHex,
  isValidAddress,
  parseAddress,
  formatAddress,
  shortenAddress,
  parseAmount,
  formatAmount,
  formatAmountWithSymbol,
  getCurrentTimestamp,
  formatTimestamp,
  formatBlockDuration,
} from '../src/index.js';

describe('Hex Encoding', () => {
  it('should convert bytes to hex', () => {
    const bytes = new Uint8Array([0x00, 0xff, 0x12, 0xab]);
    expect(bytesToHex(bytes)).toBe('00ff12ab');
  });

  it('should convert hex to bytes', () => {
    const bytes = hexToBytes('00ff12ab');
    expect(bytes).toEqual(new Uint8Array([0x00, 0xff, 0x12, 0xab]));
  });

  it('should handle 0x prefix', () => {
    const bytes = hexToBytes('0x00ff12ab');
    expect(bytes).toEqual(new Uint8Array([0x00, 0xff, 0x12, 0xab]));
  });

  it('should validate hex strings', () => {
    expect(isValidHex('00ff12ab')).toBe(true);
    expect(isValidHex('0x00ff12ab')).toBe(true);
    expect(isValidHex('AABB')).toBe(true);
    expect(isValidHex('')).toBe(true);

    expect(isValidHex('0')).toBe(false); // Odd length
    expect(isValidHex('xyz')).toBe(false);
    expect(isValidHex('00gg')).toBe(false);
  });
});

describe('Address Formatting', () => {
  const validAddress = '0'.repeat(64);
  const shortAddress = '0'.repeat(32);

  it('should validate addresses', () => {
    expect(isValidAddress(validAddress)).toBe(true);
    expect(isValidAddress('0x' + validAddress)).toBe(true);

    expect(isValidAddress(shortAddress)).toBe(false);
    expect(isValidAddress('invalid')).toBe(false);
  });

  it('should parse valid addresses', () => {
    const bytes = parseAddress(validAddress);
    expect(bytes).toHaveLength(32);
  });

  it('should throw on invalid addresses', () => {
    expect(() => parseAddress('invalid')).toThrow();
  });

  it('should format address bytes', () => {
    const bytes = new Uint8Array(32).fill(0xab);
    const formatted = formatAddress(bytes);
    expect(formatted).toBe('ab'.repeat(32));
  });

  it('should shorten addresses', () => {
    const address = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    expect(shortenAddress(address, 6)).toBe('abcdef...567890');
    expect(shortenAddress(address, 4)).toBe('abcd...7890');
  });
});

describe('Amount Formatting', () => {
  it('should parse whole numbers', () => {
    expect(parseAmount('100')).toBe(100_000_000n);
    expect(parseAmount('1')).toBe(1_000_000n);
    expect(parseAmount('0')).toBe(0n);
  });

  it('should parse decimal numbers', () => {
    expect(parseAmount('100.5')).toBe(100_500_000n);
    expect(parseAmount('0.000001')).toBe(1n);
    expect(parseAmount('1.123456')).toBe(1_123_456n);
  });

  it('should parse numbers with extra decimals (truncate)', () => {
    expect(parseAmount('1.1234567')).toBe(1_123_456n); // Truncated
  });

  it('should format amounts', () => {
    expect(formatAmount(100_000_000n)).toBe('100');
    expect(formatAmount(100_500_000n)).toBe('100.5');
    expect(formatAmount(1n)).toBe('0.000001');
    expect(formatAmount(0n)).toBe('0');
  });

  it('should format with symbol', () => {
    expect(formatAmountWithSymbol(100_000_000n)).toBe('100 TESS');
    expect(formatAmountWithSymbol(1_500_000n)).toBe('1.5 TESS');
  });
});

describe('Time Formatting', () => {
  it('should get current timestamp', () => {
    const ts = getCurrentTimestamp();
    const now = BigInt(Math.floor(Date.now() / 1000));

    // Should be within 2 seconds
    expect(ts >= now - 2n && ts <= now + 2n).toBe(true);
  });

  it('should format timestamp to ISO string', () => {
    const ts = 1699876543n;
    const formatted = formatTimestamp(ts);

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should format block duration', () => {
    expect(formatBlockDuration(1n)).toBe('3 seconds');
    expect(formatBlockDuration(20n)).toBe('~1 minute');
    expect(formatBlockDuration(1200n)).toBe('~1 hour');
    expect(formatBlockDuration(28800n)).toBe('~1 day');
    expect(formatBlockDuration(57600n)).toBe('~2 days');
  });
});
