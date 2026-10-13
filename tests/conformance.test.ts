/**
 * Official Unicode 17.0.0 conformance files for UAX #9 (tests/fixtures/ucd-17.0.0):
 * BidiTest.txt (Bidi_Class sequences) and BidiCharacterTest.txt (code points, incl. brackets).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { lineLevels, resolveClasses, resolveLevels, visualOrder, type BidiClass, type Direction } from '../src/index.js'

const fixture = (name: string) => readFileSync(new URL(`./fixtures/ucd-17.0.0/${name}`, import.meta.url), 'utf8')

function check(result: ReturnType<typeof resolveClasses>, levels: string[], order: string): string | null {
  const n = levels.length
  const got = lineLevels(result, 0, n)
  for (let i = 0; i < n; i++) {
    if (levels[i] === 'x') continue
    if (got[i] !== Number(levels[i])) return `levels ${got.map((l, k) => (levels[k] === 'x' ? 'x' : l)).join(' ')}`
  }
  const vis = visualOrder(result, 0, n).join(' ')
  if (vis !== order) return `order ${vis}`
  return null
}

describe('UAX #9 conformance (Unicode 17.0.0)', () => {
  it('BidiTest.txt', () => {
    let levels: string[] = []
    let order = ''
    let cases = 0
    const failures: string[] = []
    for (const line of fixture('BidiTest.txt').split('\n')) {
      if (line === '' || line.startsWith('#')) continue
      if (line.startsWith('@Levels:')) { levels = line.slice(8).trim().split(/\s+/).filter(Boolean); continue }
      if (line.startsWith('@Reorder:')) { order = line.slice(9).trim().split(/\s+/).filter(Boolean).join(' '); continue }
      if (line.startsWith('@')) continue
      const [input, bits] = line.split(';')
      const classes = input!.trim().split(/\s+/) as BidiClass[]
      const mask = Number(bits!.trim())
      for (const [bit, dir] of [[1, 'auto'], [2, 'ltr'], [4, 'rtl']] as [number, Direction][]) {
        if (!(mask & bit)) continue
        cases++
        const r = resolveClasses(classes, { direction: dir })
        const why = check(r, levels, order)
        if (why && failures.length < 20) failures.push(`${input} [${dir}] expected levels ${levels.join(' ')} order ${order}; got ${why}`)
      }
    }
    expect(failures).toEqual([])
    expect(cases).toBeGreaterThan(700_000)
  })

  it('BidiCharacterTest.txt', () => {
    let cases = 0
    const failures: string[] = []
    for (const line of fixture('BidiCharacterTest.txt').split('\n')) {
      if (line === '' || line.startsWith('#')) continue
      const [cpsField, dirField, paraField, levelsField, orderField] = line.split(';')
      const cps = cpsField!.trim().split(/\s+/).map(h => parseInt(h, 16))
      const dir: Direction = dirField === '0' ? 'ltr' : dirField === '1' ? 'rtl' : 'auto'
      const levels = levelsField!.trim().split(/\s+/)
      const order = orderField!.trim().split(/\s+/).filter(Boolean).join(' ')
      cases++
      const r = resolveLevels(cps, { direction: dir })
      const why = r.paragraphs[0]!.level !== Number(paraField) ? `paragraph level ${r.paragraphs[0]!.level}` : check(r, levels, order)
      if (why && failures.length < 20) failures.push(`${cpsField} [${dir}] expected ${levelsField} / ${order}; got ${why}`)
    }
    expect(failures).toEqual([])
    expect(cases).toBeGreaterThan(90_000)
  })
})
