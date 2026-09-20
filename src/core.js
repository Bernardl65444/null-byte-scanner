/**
 * Scans buffers and strings for null bytes and control characters.
 *
 * The scanner distinguishes between three categories of bytes:
 * - printable ASCII (0x20-0x7e) plus common whitespace (tab, LF, CR)
 * - control characters (0x00-0x1f and 0x7f) other than tab/LF/CR
 * - non-ASCII bytes (0x80-0xff)
 *
 * A null byte is always reported separately because it is the strongest signal
 * of binary content or encoding corruption (e.g. UTF-16 misinterpreted as
 * ASCII, or a NUL-terminated string embedded in a file).
 */
export class NullByteScanner {
  /**
   * @param {Uint8Array|string} input
   */
  constructor(input) {
    if (typeof input === 'string') {
      this.bytes = new TextEncoder().encode(input);
    } else if (input instanceof Uint8Array) {
      this.bytes = input;
    } else {
      throw new TypeError('input must be a string or Uint8Array');
    }
  }

  /**
   * Count the number of null bytes (0x00).
   * @returns {number}
   */
  countNullBytes() {
    let count = 0;
    for (const byte of this.bytes) {
      if (byte === 0x00) count++;
    }
    return count;
  }

  /**
   * Return the indexes (0-based) of all null bytes.
   * @returns {number[]}
   */
  findNullByteIndexes() {
    const indexes = [];
    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] === 0x00) indexes.push(i);
    }
    return indexes;
  }

  /**
   * Return the number of control characters (0x00-0x1f, 0x7f) excluding
   * tab (0x09), line feed (0x0a), and carriage return (0x0d).
   * Null bytes are included in this count.
   * @returns {number}
   */
  countControlCharacters() {
    let count = 0;
    for (const byte of this.bytes) {
      if (this.isControlByte(byte)) count++;
    }
    return count;
  }

  /**
   * Return the indexes of all control characters (see countControlCharacters).
   * @returns {number[]}
   */
  findControlCharacterIndexes() {
    const indexes = [];
    for (let i = 0; i < this.bytes.length; i++) {
      if (this.isControlByte(this.bytes[i])) indexes.push(i);
    }
    return indexes;
  }

  /**
   * True if the input contains at least one null byte.
   * @returns {boolean}
   */
  hasNullBytes() {
    return this.countNullBytes() > 0;
  }

  /**
   * True if the input contains at least one control character (see
   * countControlCharacters).
   * @returns {boolean}
   */
  hasControlCharacters() {
    return this.countControlCharacters() > 0;
  }

  /**
   * Return an object summarising the scan.
   * @returns {{
   *   totalBytes: number,
   *   nullByteCount: number,
   *   controlCharacterCount: number,
   *   nonAsciiByteCount: number,
   *   isBinary: boolean
   * }}
   */
  scan() {
    let nullCount = 0;
    let controlCount = 0;
    let nonAsciiCount = 0;
    for (const byte of this.bytes) {
      if (byte === 0x00) {
        nullCount++;
        controlCount++;
      } else if (this.isControlByte(byte)) {
        controlCount++;
      }
      if (byte > 0x7f) nonAsciiCount++;
    }
    return {
      totalBytes: this.bytes.length,
      nullByteCount: nullCount,
      controlCharacterCount: controlCount,
      nonAsciiByteCount: nonAsciiCount,
      isBinary: nullCount > 0 || controlCount > 0 || nonAsciiCount > 0,
    };
  }

  /**
   * @private
   * @param {number} byte
   * @returns {boolean}
   */
  isControlByte(byte) {
    return (byte <= 0x1f || byte === 0x7f) && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d;
  }
}
