/**
 * LombokUnicode - Unicode Bidirectional Algorithm (UAX #9, Unicode 17.0.0).
 * SPEC section 3. Works on code points; string helpers convert at the edges.
 */
import { BRACKETS, CLASS_NAMES, MIRRORS, RANGE_CLASSES, RANGE_STARTS } from './bidi-data.js'

export type BidiClass = (typeof CLASS_NAMES)[number]
export type Direction = 'ltr' | 'rtl' | 'auto'

/** Deepest explicit embedding level (BD2). */
export const MAX_DEPTH = 125
/** Bracket pairs are searched with a stack of this size (BD16). */
const BRACKET_STACK = 63

// ─── Character properties ────────────────────────────────────────────────────

function checkCodePoint(cp: number): void {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) throw new RangeError(`not a code point: ${cp}`)
}

/** Bidi_Class of a code point (SPEC 2.1). */
export function bidiClass(cp: number): BidiClass {
  checkCodePoint(cp)
  let lo = 0
  let hi = RANGE_STARTS.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (RANGE_STARTS[mid]! <= cp) lo = mid
    else hi = mid - 1
  }
  return CLASS_NAMES[RANGE_CLASSES.charCodeAt(lo) - 65]!
}

function search(table: readonly number[], stride: number, cp: number): number {
  let lo = 0
  let hi = table.length / stride - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const v = table[mid * stride]!
    if (v === cp) return mid * stride
    if (v < cp) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}

/** Bidi_Mirroring_Glyph, or null when the code point has none (SPEC 2.2). */
export function mirrorOf(cp: number): number | null {
  checkCodePoint(cp)
  const i = search(MIRRORS, 2, cp)
  return i < 0 ? null : MIRRORS[i + 1]!
}

/** Bidi_Paired_Bracket and Bidi_Paired_Bracket_Type, or null (SPEC 2.3). */
export function pairedBracket(cp: number): { pair: number; type: 'open' | 'close' } | null {
  checkCodePoint(cp)
  const i = search(BRACKETS, 3, cp)
  return i < 0 ? null : { pair: BRACKETS[i + 1]!, type: BRACKETS[i + 2] === 1 ? 'open' : 'close' }
}

/** Canonical equivalents among brackets (U+2329/U+232A decompose to U+3008/U+3009). */
function canonicalBracket(cp: number): number {
  return cp === 0x2329 ? 0x3008 : cp === 0x232a ? 0x3009 : cp
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface Paragraph {
  /** Index of the first code point. */
  start: number
  /** Index after the last code point (the paragraph separator, if any, is included). */
  end: number
  /** Paragraph embedding level: 0 (LTR) or 1 (RTL). */
  level: number
}

export interface BidiResult {
  /** Resolved embedding level of every code point (SPEC 3.4 for removed characters). */
  levels: number[]
  /** True for characters removed by rule X9 (explicit formatting characters and BN). */
  removed: boolean[]
  /** Original Bidi_Class of every code point. */
  classes: BidiClass[]
  paragraphs: Paragraph[]
}

export interface BidiOptions {
  /** Paragraph direction: 'ltr' (level 0), 'rtl' (level 1) or 'auto' (rules P2-P3, default). */
  direction?: Direction
}

const STRONG_OR_ISOLATE = new Set<BidiClass>(['L', 'R', 'AL', 'LRI', 'RLI', 'FSI', 'PDI'])
const ISOLATE_INIT = new Set<BidiClass>(['LRI', 'RLI', 'FSI'])
const REMOVED_BY_X9 = new Set<BidiClass>(['RLE', 'LRE', 'RLO', 'LRO', 'PDF', 'BN'])
const NEUTRAL_OR_ISOLATE = new Set<BidiClass>(['B', 'S', 'WS', 'ON', 'LRI', 'RLI', 'FSI', 'PDI'])

/**
 * P2-P3: level of the first strong character in [from, to), skipping isolates;
 * `null` when there is none.
 */
function firstStrongLevel(cls: readonly BidiClass[], from: number, to: number, stopAtUnmatchedPdi: boolean): number | null {
  let depth = 0
  for (let i = from; i < to; i++) {
    const t = cls[i]!
    if (ISOLATE_INIT.has(t)) depth++
    else if (t === 'PDI') {
      if (depth > 0) depth--
      else if (stopAtUnmatchedPdi) return null
    } else if (depth === 0) {
      if (t === 'L') return 0
      if (t === 'R' || t === 'AL') return 1
    }
  }
  return null
}

/** Code points of a string. */
export function codePoints(text: string): number[] {
  const out: number[] = []
  for (const ch of text) out.push(ch.codePointAt(0)!)
  return out
}

/** Resolve embedding levels for text given as a string or code points (SPEC 3). */
export function resolveLevels(text: string | readonly number[], options: BidiOptions = {}): BidiResult {
  const cps = typeof text === 'string' ? codePoints(text) : [...text]
  return resolveClasses(cps.map(bidiClass), options, cps)
}

/**
 * Resolve levels from Bidi_Class values. `codePoints` enables rule N0 (bracket
 * pairs); without it brackets are treated as ordinary neutrals.
 */
export function resolveClasses(classes: readonly BidiClass[], options: BidiOptions = {}, codePointsIn?: readonly number[]): BidiResult {
  const n = classes.length
  const direction = options.direction ?? 'auto'
  const levels = new Array<number>(n).fill(0)
  const removed = new Array<boolean>(n).fill(false)
  const paragraphs: Paragraph[] = []

  // P1: split at paragraph separators (kept at the end of their paragraph)
  let start = 0
  for (let i = 0; i <= n; i++) {
    if (i === n || classes[i] === 'B') {
      const end = i === n ? n : i + 1
      if (end > start || n === 0) {
        const level = direction === 'ltr' ? 0 : direction === 'rtl' ? 1 : (firstStrongLevel(classes, start, end, false) ?? 0)
        paragraphs.push({ start, end, level })
        resolveParagraph(classes, codePointsIn, start, end, level, levels, removed)
      }
      start = end
    }
  }
  return { levels, removed, classes: [...classes], paragraphs }
}

interface StackEntry { level: number; override: 'N' | 'L' | 'R'; isolate: boolean }

function resolveParagraph(
  orig: readonly BidiClass[], cps: readonly number[] | undefined,
  start: number, end: number, paraLevel: number,
  levels: number[], removed: boolean[],
): void {
  const types: BidiClass[] = orig.slice(start, end)
  const len = types.length
  const lv = new Array<number>(len).fill(paraLevel)
  const rm = new Array<boolean>(len).fill(false)

  // BD9: matching PDI for each isolate initiator (and the reverse)
  const matchPdi = new Array<number>(len).fill(-1)
  const matchedPdi = new Array<boolean>(len).fill(false)
  {
    const open: number[] = []
    for (let i = 0; i < len; i++) {
      const t = types[i]!
      if (ISOLATE_INIT.has(t)) open.push(i)
      else if (t === 'PDI' && open.length > 0) {
        const o = open.pop()!
        matchPdi[o] = i
        matchedPdi[i] = true
      }
    }
  }

  // X1-X8: explicit levels and directions
  const stack: StackEntry[] = [{ level: paraLevel, override: 'N', isolate: false }]
  let overflowIsolate = 0
  let overflowEmbedding = 0
  let validIsolate = 0
  const top = () => stack[stack.length - 1]!
  const nextOdd = (l: number) => (l % 2 === 0 ? l + 1 : l + 2)
  const nextEven = (l: number) => (l % 2 === 0 ? l + 2 : l + 1)

  for (let i = 0; i < len; i++) {
    const t = orig[start + i]!
    switch (t) {
      case 'RLE': case 'LRE': case 'RLO': case 'LRO': {
        const level = t === 'RLE' || t === 'RLO' ? nextOdd(top().level) : nextEven(top().level)
        lv[i] = top().level
        if (level <= MAX_DEPTH && overflowIsolate === 0 && overflowEmbedding === 0) {
          stack.push({ level, override: t === 'RLO' ? 'R' : t === 'LRO' ? 'L' : 'N', isolate: false })
        } else if (overflowIsolate === 0) {
          overflowEmbedding++
        }
        break
      }
      case 'RLI': case 'LRI': case 'FSI': {
        lv[i] = top().level
        if (top().override !== 'N') types[i] = top().override as BidiClass
        if (overflowIsolate > 0 || overflowEmbedding > 0) { overflowIsolate++; break }
        // FSI direction is only needed when the isolate is opened, which bounds the scans by MAX_DEPTH
        let rtl = t === 'RLI'
        if (t === 'FSI') {
          const stop = matchPdi[i]! >= 0 ? matchPdi[i]! : len
          rtl = firstStrongLevel(orig, start + i + 1, start + stop, true) === 1
        }
        const level = rtl ? nextOdd(top().level) : nextEven(top().level)
        if (level <= MAX_DEPTH) {
          validIsolate++
          stack.push({ level, override: 'N', isolate: true })
        } else {
          overflowIsolate++
        }
        break
      }
      case 'PDI': {
        if (overflowIsolate > 0) overflowIsolate--
        else if (validIsolate > 0) {
          overflowEmbedding = 0
          while (!top().isolate) stack.pop()
          stack.pop()
          validIsolate--
        }
        lv[i] = top().level
        if (top().override !== 'N') types[i] = top().override as BidiClass
        break
      }
      case 'PDF': {
        if (overflowIsolate > 0) { /* nothing */ }
        else if (overflowEmbedding > 0) overflowEmbedding--
        else if (!top().isolate && stack.length >= 2) stack.pop()
        lv[i] = top().level
        break
      }
      case 'B':
        lv[i] = paraLevel
        break
      case 'BN':
        lv[i] = top().level
        break
      default:
        lv[i] = top().level
        if (top().override !== 'N') types[i] = top().override as BidiClass
    }
  }

  // X9: removed characters
  for (let i = 0; i < len; i++) if (REMOVED_BY_X9.has(orig[start + i]!)) rm[i] = true

  // X10: isolating run sequences
  const runs: number[][] = []
  {
    let cur: number[] = []
    let curLevel = -1
    for (let i = 0; i < len; i++) {
      if (rm[i]) continue
      if (cur.length > 0 && lv[i] !== curLevel) { runs.push(cur); cur = [] }
      cur.push(i)
      curLevel = lv[i]!
    }
    if (cur.length > 0) runs.push(cur)
  }
  const runOfFirst = new Map<number, number[]>()
  for (const r of runs) runOfFirst.set(r[0]!, r)

  const sequences: number[][] = []
  for (const r of runs) {
    const first = r[0]!
    if (orig[start + first] === 'PDI' && matchedPdi[first]) continue
    const seq: number[] = []
    let run: number[] | undefined = r
    while (run) {
      for (const k of run) seq.push(k)
      const last: number = run[run.length - 1]!
      const m: number = ISOLATE_INIT.has(orig[start + last]!) ? matchPdi[last]! : -1
      run = m >= 0 ? runOfFirst.get(m) : undefined
    }
    sequences.push(seq)
  }

  const keptBefore = (i: number): number => { for (let j = i - 1; j >= 0; j--) if (!rm[j]) return j; return -1 }
  const keptAfter = (i: number): number => { for (let j = i + 1; j < len; j++) if (!rm[j]) return j; return -1 }
  const dirOf = (l: number): BidiClass => (l % 2 === 0 ? 'L' : 'R')

  for (const seq of sequences) {
    const first = seq[0]!
    const last = seq[seq.length - 1]!
    const level = lv[first]!
    const before = keptBefore(first)
    const sos = dirOf(Math.max(level, before >= 0 ? lv[before]! : paraLevel))
    const after = ISOLATE_INIT.has(orig[start + last]!) ? -1 : keptAfter(last)
    const eos = dirOf(Math.max(level, after >= 0 ? lv[after]! : paraLevel))
    resolveSequence(seq, types, orig, cps, start, level, sos, eos)
  }

  // I1-I2: implicit levels
  for (let i = 0; i < len; i++) {
    if (rm[i]) continue
    const t = types[i]!
    if (lv[i]! % 2 === 0) {
      if (t === 'R') lv[i]! += 1
      else if (t === 'AN' || t === 'EN') lv[i]! += 2
    } else if (t === 'L' || t === 'EN' || t === 'AN') {
      lv[i]! += 1
    }
  }

  // SPEC 3.4: removed characters take the level of the preceding kept character
  {
    let last = paraLevel
    for (let i = 0; i < len; i++) {
      if (rm[i]) lv[i] = last
      else last = lv[i]!
    }
  }

  for (let i = 0; i < len; i++) {
    levels[start + i] = lv[i]!
    removed[start + i] = rm[i]!
  }
}

function resolveSequence(
  seq: number[], types: BidiClass[], orig: readonly BidiClass[], cps: readonly number[] | undefined,
  base: number, level: number, sos: BidiClass, eos: BidiClass,
): void {
  const m = seq.length
  const t = (k: number) => types[seq[k]!]!
  const set = (k: number, v: BidiClass) => { types[seq[k]!] = v }

  // W1
  for (let k = 0; k < m; k++) {
    if (t(k) !== 'NSM') continue
    if (k === 0) set(k, sos)
    else {
      const p = t(k - 1)
      set(k, ISOLATE_INIT.has(p) || p === 'PDI' ? 'ON' : p)
    }
  }
  // W2 (one forward pass: the last strong type seen so far)
  {
    let strong: BidiClass = sos
    for (let k = 0; k < m; k++) {
      const c = t(k)
      if (c === 'L' || c === 'R' || c === 'AL') strong = c
      else if (c === 'EN' && strong === 'AL') set(k, 'AN')
    }
  }
  // W3
  for (let k = 0; k < m; k++) if (t(k) === 'AL') set(k, 'R')
  // W4
  for (let k = 1; k < m - 1; k++) {
    const c = t(k)
    const a = t(k - 1)
    const b = t(k + 1)
    if (c === 'ES' && a === 'EN' && b === 'EN') set(k, 'EN')
    else if (c === 'CS' && a === b && (a === 'EN' || a === 'AN')) set(k, a)
  }
  // W5
  for (let k = 0; k < m; k++) {
    if (t(k) !== 'ET') continue
    let e = k
    while (e < m && t(e) === 'ET') e++
    const touches = (k > 0 && t(k - 1) === 'EN') || (e < m && t(e) === 'EN')
    if (touches) for (let j = k; j < e; j++) set(j, 'EN')
    k = e - 1
  }
  // W6
  for (let k = 0; k < m; k++) {
    const c = t(k)
    if (c === 'ES' || c === 'ET' || c === 'CS') set(k, 'ON')
  }
  // W7 (one forward pass)
  {
    let strong: BidiClass = sos
    for (let k = 0; k < m; k++) {
      const c = t(k)
      if (c === 'L' || c === 'R') strong = c
      else if (c === 'EN' && strong === 'L') set(k, 'L')
    }
  }

  const embedding: BidiClass = level % 2 === 0 ? 'L' : 'R'
  const strongDir = (c: BidiClass): BidiClass | null => (c === 'L' ? 'L' : c === 'R' || c === 'EN' || c === 'AN' ? 'R' : null)

  // N0: paired brackets
  if (cps) {
    const pairs: [number, number][] = []
    const stack: [number, number][] = [] // [canonical pair code point, position]
    outer: for (let k = 0; k < m; k++) {
      if (t(k) !== 'ON') continue
      const cp = cps[base + seq[k]!]!
      const pb = pairedBracket(cp)
      if (!pb) continue
      if (pb.type === 'open') {
        if (stack.length === BRACKET_STACK) break outer
        stack.push([canonicalBracket(pb.pair), k])
      } else {
        const me = canonicalBracket(cp)
        for (let s = stack.length - 1; s >= 0; s--) {
          if (stack[s]![0] === me) {
            pairs.push([stack[s]![1], k])
            stack.length = s
            break
          }
        }
      }
    }
    pairs.sort((a, b) => a[0] - b[0])
    for (const [open, close] of pairs) {
      let foundEmbedding = false
      let foundOpposite = false
      for (let k = open + 1; k < close; k++) {
        const d = strongDir(t(k))
        if (d === embedding) { foundEmbedding = true; break }
        if (d !== null) foundOpposite = true
      }
      let resolved: BidiClass | null = null
      if (foundEmbedding) resolved = embedding
      else if (foundOpposite) {
        let ctx: BidiClass = sos
        for (let k = open - 1; k >= 0; k--) {
          const d = strongDir(t(k))
          if (d !== null) { ctx = d; break }
        }
        resolved = ctx !== embedding ? ctx : embedding
      }
      if (resolved) {
        for (const pos of [open, close]) {
          set(pos, resolved)
          for (let k = pos + 1; k < m && orig[base + seq[k]!] === 'NSM'; k++) set(k, resolved)
        }
      }
    }
  }

  // N1-N2
  for (let k = 0; k < m; k++) {
    if (!NEUTRAL_OR_ISOLATE.has(t(k))) continue
    let e = k
    while (e < m && NEUTRAL_OR_ISOLATE.has(t(e))) e++
    const prev = k === 0 ? sos : strongDir(t(k - 1)) ?? sos
    const next = e === m ? eos : strongDir(t(e)) ?? eos
    const v = prev === next ? prev : embedding
    for (let j = k; j < e; j++) set(j, v)
    k = e - 1
  }
}

// ─── Reordering ──────────────────────────────────────────────────────────────

const TRAILING = new Set<BidiClass>(['WS', 'FSI', 'LRI', 'RLI', 'PDI'])

/**
 * Levels of the line [lineStart, lineEnd) after rule L1. The line must lie inside one paragraph.
 */
export function lineLevels(result: BidiResult, lineStart: number, lineEnd: number): number[] {
  const para = result.paragraphs.find(p => lineStart >= p.start && lineEnd <= p.end && lineStart < p.end)
  if (!para && lineStart !== lineEnd) throw new RangeError('line must lie inside one paragraph')
  const paraLevel = para?.level ?? 0
  const out = result.levels.slice(lineStart, lineEnd)
  const cls = result.classes
  let trailing = true
  for (let i = lineEnd - 1; i >= lineStart; i--) {
    const c = cls[i]!
    if (c === 'B' || c === 'S') { out[i - lineStart] = paraLevel; trailing = true; continue }
    if (trailing && (TRAILING.has(c) || REMOVED_BY_X9.has(c))) { out[i - lineStart] = paraLevel; continue }
    trailing = false
  }
  return out
}

/**
 * Visual order of the line [lineStart, lineEnd): logical indices from left to right
 * (rules L1-L2). Characters removed by X9 are omitted unless `keepRemoved` is true.
 */
export function visualOrder(result: BidiResult, lineStart: number, lineEnd: number, keepRemoved = false): number[] {
  const lv = lineLevels(result, lineStart, lineEnd)
  const idx: number[] = []
  const levs: number[] = []
  for (let i = lineStart; i < lineEnd; i++) {
    if (!keepRemoved && result.removed[i]) continue
    idx.push(i)
    levs.push(lv[i - lineStart]!)
  }
  if (idx.length === 0) return idx
  let max = 0
  let minOdd = Infinity
  for (const l of levs) {
    if (l > max) max = l
    if (l % 2 === 1 && l < minOdd) minOdd = l
  }
  for (let level = max; level >= minOdd && level >= 1; level--) {
    for (let k = 0; k < idx.length; k++) {
      if (levs[k]! < level) continue
      let e = k
      while (e < idx.length && levs[e]! >= level) e++
      reverse(idx, k, e)
      reverse(levs, k, e)
      k = e
    }
  }
  return idx
}

function reverse<T>(a: T[], from: number, to: number): void {
  for (let i = from, j = to - 1; i < j; i++, j--) { const x = a[i]!; a[i] = a[j]!; a[j] = x }
}

export interface VisualOptions extends BidiOptions {
  /** Replace characters at odd levels by their Bidi_Mirroring_Glyph (rule L4, default true). */
  mirror?: boolean
}

/**
 * Text in visual order, one line per paragraph: each paragraph is reordered as a single
 * line (no line breaking), X9-removed characters are dropped, mirrored glyphs applied (SPEC 4).
 */
export function toVisual(text: string, options: VisualOptions = {}): string {
  const cps = codePoints(text)
  const result = resolveLevels(cps, options)
  const mirror = options.mirror ?? true
  let out = ''
  for (const p of result.paragraphs) {
    const sepAtEnd = p.end > p.start && result.classes[p.end - 1] === 'B'
    const lineEnd = sepAtEnd ? p.end - 1 : p.end
    for (const i of visualOrder(result, p.start, lineEnd)) {
      const cp = cps[i]!
      const m = mirror && result.levels[i]! % 2 === 1 ? mirrorOf(cp) : null
      out += String.fromCodePoint(m ?? cp)
    }
    if (sepAtEnd) out += String.fromCodePoint(cps[p.end - 1]!)
  }
  return out
}

/** Paragraph direction of `text` by rules P2-P3: 'rtl', 'ltr', or null without strong characters. */
export function detectDirection(text: string): 'ltr' | 'rtl' | null {
  const cls = codePoints(text).map(bidiClass)
  const l = firstStrongLevel(cls, 0, cls.length, false)
  return l === null ? null : l === 1 ? 'rtl' : 'ltr'
}
