import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NullByteScanner } from '../src/index.js';

test('empty string has no null bytes or control characters', () => {
  const scanner = new NullByteScanner('');
  assert.equal(scanner.hasNullBytes(), false);
  assert.equal(scanner.hasControlCharacters(), false);
  assert.deepEqual(scanner.findNullByteIndexes(), []);
  assert.deepEqual(scanner.findControlCharacterIndexes(), []);
  assert.deepEqual(scanner.scan(), {
    totalBytes: 0,
    nullByteCount: 0,
    controlCharacterCount: 0,
    nonAsciiByteCount: 0,
    isBinary: false,
  });
});

test('plain ASCII text has no null bytes or control characters', () => {
  const scanner = new NullByteScanner('Hello, world!');
  assert.equal(scanner.countNullBytes(), 0);
  assert.equal(scanner.countControlCharacters(), 0);
  assert.equal(scanner.hasNullBytes(), false);
  assert.equal(scanner.hasControlCharacters(), false);
  assert.equal(scanner.scan().isBinary, false);
});

test('string with a single null byte is detected', () => {
  const scanner = new NullByteScanner('a\0b');
  assert.equal(scanner.countNullBytes(), 1);
  assert.deepEqual(scanner.findNullByteIndexes(), [1]);
  assert.equal(scanner.hasNullBytes(), true);
  assert.equal(scanner.scan().isBinary, true);
});

test('multiple null bytes are all counted and indexed', () => {
  const scanner = new NullByteScanner('\0a\0\0b');
  assert.equal(scanner.countNullBytes(), 3);
  assert.deepEqual(scanner.findNullByteIndexes(), [0, 2, 3]);
  assert.equal(scanner.scan().nullByteCount, 3);
});

test('control characters other than tab, LF, CR are detected', () => {
  const scanner = new NullByteScanner('\x01\x02\x1f');
  assert.equal(scanner.countControlCharacters(), 3);
  assert.deepEqual(scanner.findControlCharacterIndexes(), [0, 1, 2]);
  assert.equal(scanner.hasControlCharacters(), true);
  assert.equal(scanner.scan().controlCharacterCount, 3);
});

test('tab, LF, and CR are not treated as control characters', () => {
  const scanner = new NullByteScanner('\t\n\r');
  assert.equal(scanner.countControlCharacters(), 0);
  assert.equal(scanner.hasControlCharacters(), false);
  assert.deepEqual(scanner.findControlCharacterIndexes(), []);
});

test('DEL (0x7f) is a control character', () => {
  const scanner = new NullByteScanner('\x7f');
  assert.equal(scanner.countControlCharacters(), 1);
  assert.deepEqual(scanner.findControlCharacterIndexes(), [0]);
});

test('mixed content reports all categories correctly', () => {
  const scanner = new NullByteScanner('A\0B\x01C\x80');
  assert.equal(scanner.countNullBytes(), 1);
  assert.equal(scanner.countControlCharacters(), 2); // null + \x01
  assert.deepEqual(scanner.findNullByteIndexes(), [1]);
  assert.deepEqual(scanner.findControlCharacterIndexes(), [1, 3]);
  const summary = scanner.scan();
  assert.equal(summary.totalBytes, 7);
  assert.equal(summary.nullByteCount, 1);
  assert.equal(summary.controlCharacterCount, 2);
  assert.equal(summary.nonAsciiByteCount, 2);
  assert.equal(summary.isBinary, true);
});

test('Uint8Array input is accepted', () => {
  const bytes = new Uint8Array([0x48, 0x00, 0x49, 0x01]);
  const scanner = new NullByteScanner(bytes);
  assert.equal(scanner.countNullBytes(), 1);
  assert.equal(scanner.countControlCharacters(), 2);
  assert.deepEqual(scanner.findNullByteIndexes(), [1]);
  assert.deepEqual(scanner.findControlCharacterIndexes(), [1, 3]);
});

test('non-ASCII bytes are counted but not control characters', () => {
  const bytes = new Uint8Array([0x80, 0xff, 0x41]);
  const scanner = new NullByteScanner(bytes);
  assert.equal(scanner.countControlCharacters(), 0);
  assert.equal(scanner.countNullBytes(), 0);
  assert.equal(scanner.scan().nonAsciiByteCount, 2);
  assert.equal(scanner.scan().isBinary, true);
});

test('invalid input type throws TypeError', () => {
  assert.throws(() => new NullByteScanner(123), TypeError);
  assert.throws(() => new NullByteScanner(null), TypeError);
  assert.throws(() => new NullByteScanner({}), TypeError);
});

test('empty Uint8Array behaves like empty string', () => {
  const scanner = new NullByteScanner(new Uint8Array(0));
  assert.equal(scanner.hasNullBytes(), false);
  assert.equal(scanner.hasControlCharacters(), false);
  assert.deepEqual(scanner.scan(), {
    totalBytes: 0,
    nullByteCount: 0,
    controlCharacterCount: 0,
    nonAsciiByteCount: 0,
    isBinary: false,
  });
});
