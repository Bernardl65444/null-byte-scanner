# Null Byte Scanner

Scans strings and byte buffers for null bytes and control characters to detect binary content and encoding corruption.

```js
import { NullByteScanner } from './src/index.js';

const scanner = new NullByteScanner('A\0B\x01C');

console.log(scanner.countNullBytes());          // 1
console.log(scanner.countControlCharacters());  // 2
console.log(scanner.findNullByteIndexes());     // [1]
console.log(scanner.scan());
// {
//   totalBytes: 4,
//   nullByteCount: 1,
//   controlCharacterCount: 2,
//   nonAsciiByteCount: 0,
//   isBinary: true
// }
```

The scanner accepts a string or a `Uint8Array`. Strings are encoded as UTF-8 before scanning.

## Why this exists

A null byte in a text file is usually a sign that something is wrong: the file may be binary, or it may be the result of decoding UTF-16 as ASCII, or it may contain embedded NUL-terminated data. Control characters other than tab, line feed, and carriage return are similarly suspicious in text content. This library provides a small, dependency-free way to locate those bytes and decide whether a file should be treated as binary.

## Behavioural notes

- Tab (`0x09`), line feed (`0x0a`), and carriage return (`0x0d`) are not counted as control characters. They are ordinary whitespace in text.
- Null bytes are always included in the control character count.
- Non-ASCII bytes (`0x80`-`0xff`) are counted separately and cause `isBinary` to be true, but they are not control characters.
- `scan()` returns `isBinary: true` if any null byte, control character, or non-ASCII byte is present.

## API

### `new NullByteScanner(input)`

Creates a scanner for `input`, which must be a string or `Uint8Array`.

### `countNullBytes(): number`

Returns the number of null bytes (`0x00`).

### `findNullByteIndexes(): number[]`

Returns the indexes of all null bytes.

### `countControlCharacters(): number`

Returns the number of control characters (`0x00`-`0x1f`, `0x7f`) excluding tab, LF, and CR. Includes null bytes.

### `findControlCharacterIndexes(): number[]`

Returns the indexes of all control characters as defined above.

### `hasNullBytes(): boolean`

True if the input contains at least one null byte.

### `hasControlCharacters(): boolean`

True if the input contains at least one control character as defined above.

### `scan(): object`

Returns a summary object with `totalBytes`, `nullByteCount`, `controlCharacterCount`, `nonAsciiByteCount`, and `isBinary`.
