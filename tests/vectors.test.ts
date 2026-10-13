/**
 * Vector runner (GP-11): every case in vectors/lombokunicode-vectors-v1.json.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  bidiClass, detectDirection, lineLevels, mirrorOf, pairedBracket, resolveLevels, toVisual, visualOrder, type Direction,
} from '../src/index.js'

interface Case { id: string; fn: string; input: Record<string, any>; expected: unknown }
const doc = JSON.parse(readFileSync(new URL('../vectors/lombokunicode-vectors-v1.json', import.meta.url), 'utf8')) as { cases: Case[] }

function run(c: Case): unknown {
  const i = c.input
  switch (c.fn) {
    case 'class': return bidiClass(i['cp'])
    case 'mirror': return mirrorOf(i['cp'])
    case 'bracket': return pairedBracket(i['cp'])
    case 'levels': {
      const cps = i['cps'] as number[]
      const r = resolveLevels(cps, { direction: i['direction'] as Direction })
      const lv = lineLevels(r, 0, cps.length)
      return {
        paragraphLevel: r.paragraphs[0]!.level,
        levels: lv.map((l, k) => (r.removed[k] ? 'x' : String(l))),
        order: visualOrder(r, 0, cps.length),
      }
    }
    case 'visual': return toVisual(i['text'], { direction: i['direction'] as Direction })
    case 'direction': return detectDirection(i['text'])
    default: throw new Error(c.fn)
  }
}

describe('lombokunicode vectors v1', () => {
  it('has at least 100 cases', () => expect(doc.cases.length).toBeGreaterThanOrEqual(100))
  for (const c of doc.cases) it(c.id, () => expect(run(c)).toEqual(c.expected))
})
