/**
 * LombokUnicode: Unicode algorithms with identical results across languages.
 * 0.1.0 provides the Unicode Bidirectional Algorithm (UAX #9) for Unicode 17.0.0.
 * Behaviour is specified in docs/SPEC_LombokUnicode_v0.1.0.md.
 */
export {
  MAX_DEPTH, bidiClass, codePoints, detectDirection, lineLevels, mirrorOf, pairedBracket,
  resolveClasses, resolveLevels, toVisual, visualOrder,
} from './bidi.js'
export type { BidiClass, BidiOptions, BidiResult, Direction, Paragraph, VisualOptions } from './bidi.js'
export { UNICODE_VERSION } from './bidi-data.js'
