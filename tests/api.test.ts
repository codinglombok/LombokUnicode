import { describe, expect, it } from 'vitest'
import {
  CLASS_NAMES,
} from '../src/bidi-data.js'
import {
  MAX_DEPTH, UNICODE_VERSION, bidiClass, codePoints, lineLevels, mirrorOf, pairedBracket, resolveClasses, resolveLevels,
  toVisual, visualOrder, type BidiClass,
} from '../src/index.js'

describe('properties', () => {
  it('rejects values that are not code points', () => {
    for (const bad of [-1, 0x110000, 1.5, NaN]) {
      expect(() => bidiClass(bad)).toThrow(RangeError)
      expect(() => mirrorOf(bad)).toThrow(RangeError)
      expect(() => pairedBracket(bad)).toThrow(RangeError)
    }
  })

  it('covers the first and last code points', () => {
    expect(bidiClass(0)).toBe('BN')
    expect(bidiClass(0x10ffff)).toBe('BN')
    expect(UNICODE_VERSION).toBe('17.0.0')
  })

  it('splits strings into code points', () => {
    expect(codePoints('a\u{1F600}')).toEqual([0x61, 0x1f600])
  })
})

describe('levels and reordering', () => {
  it('splits paragraphs and keeps the separator in its paragraph', () => {
    const r = resolveLevels('א\nb', {})
    expect(r.paragraphs).toEqual([{ start: 0, end: 2, level: 1 }, { start: 2, end: 3, level: 0 }])
  })

  it('handles empty input', () => {
    const r = resolveLevels('')
    expect(r.paragraphs).toEqual([{ start: 0, end: 0, level: 0 }])
    expect(visualOrder(r, 0, 0)).toEqual([])
  })

  it('rejects a line that crosses paragraphs', () => {
    const r = resolveLevels('a\nb')
    expect(() => lineLevels(r, 0, 3)).toThrow(RangeError)
  })

  it('can keep removed characters in the visual order', () => {
    const r = resolveLevels('a‫b‬c', { direction: 'ltr' })
    expect(visualOrder(r, 0, 5)).toEqual([0, 2, 4])
    expect(visualOrder(r, 0, 5, true)).toEqual([0, 1, 2, 3, 4])
    expect(r.levels).toEqual([0, 0, 2, 2, 0])
  })

  it('resets trailing whitespace to the paragraph level (L1)', () => {
    const r = resolveLevels('אב a  ', { direction: 'rtl' })
    expect(lineLevels(r, 0, 6)).toEqual([1, 1, 1, 2, 1, 1])
  })

  it('stops embedding at depth 125 and ignores overflow', () => {
    const classes: BidiClass[] = [...Array(130).fill('LRE'), 'L', ...Array(130).fill('PDF')]
    const r = resolveClasses(classes, { direction: 'ltr' })
    expect(r.levels[130]).toBeLessThanOrEqual(MAX_DEPTH + 1)
    const iso: BidiClass[] = [...Array(130).fill('RLI'), 'R', ...Array(130).fill('PDI')]
    expect(() => resolveClasses(iso, { direction: 'auto' })).not.toThrow()
  })

  it('treats brackets as neutrals without code points', () => {
    const r = resolveClasses(['R', 'ON', 'L', 'ON'], { direction: 'rtl' })
    expect(r.levels.length).toBe(4)
  })

  it('does not mirror when asked not to', () => {
    expect(toVisual('א(', { direction: 'rtl', mirror: false })).toBe('(א')
    expect(toVisual('א(', { direction: 'rtl' })).toBe(')א')
  })

  it('stays linear on long input and survives random classes', () => {
    const long = 'א a (b) 12 '.repeat(20_000)
    const t = performance.now()
    expect(toVisual(long).length).toBe([...long].length)
    expect(performance.now() - t).toBeLessThan(3000)
    let s = 7
    for (let n = 0; n < 3000; n++) {
      const cls: BidiClass[] = []
      for (let i = 0; i < 20; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; cls.push(CLASS_NAMES[s % CLASS_NAMES.length]!) }
      const r = resolveClasses(cls, { direction: (['ltr', 'rtl', 'auto'] as const)[n % 3]! })
      for (const p of r.paragraphs) {
        const end = p.end > p.start && cls[p.end - 1] === 'B' ? p.end - 1 : p.end
        const order = visualOrder(r, p.start, end, true)
        expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: end - p.start }, (_, i) => p.start + i))
      }
    }
  })
})

describe('worst cases', () => {
  it('handles many unmatched isolates and embeddings in linear time', () => {
    for (const text of ['⁨'.repeat(60_000) + 'a', '‫'.repeat(60_000) + 'a', '\u00AD'.repeat(200_000) + 'a', '(א'.repeat(30_000), '⁨a⁩'.repeat(30_000), '1 '.repeat(60_000), '\u0627 1 '.repeat(30_000)]) {
      const t = performance.now()
      toVisual(text)
      expect(performance.now() - t).toBeLessThan(3000)
    }
  })
})
