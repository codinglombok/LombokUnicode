# LombokUnicode — API v0.1.0

## 1. Ekspor

| Nama | Keterangan |
|---|---|
| `bidiClass(cp)` | Bidi_Class (SPEC §2.1) |
| `mirrorOf(cp)` | Bidi_Mirroring_Glyph atau null |
| `pairedBracket(cp)` | `{ pair, type: 'open' \| 'close' }` atau null |
| `codePoints(text)` | code point sebuah string |
| `resolveLevels(text \| cps, { direction })` | `BidiResult` (SPEC §3) |
| `resolveClasses(classes, { direction }, cps?)` | sama, dari Bidi_Class; N0 hanya bila `cps` diberikan |
| `lineLevels(result, start, end)` | level setelah L1 untuk satu baris |
| `visualOrder(result, start, end, keepRemoved?)` | indeks logis kiri ke kanan (L2) |
| `toVisual(text, { direction, mirror })` | teks visual per paragraf (SPEC §4) |
| `detectDirection(text)` | `'ltr'`, `'rtl'`, atau null |
| `MAX_DEPTH`, `UNICODE_VERSION` | 125, `'17.0.0'` |

## 2. `BidiResult`

```ts
interface BidiResult {
  levels: number[]        // level per code point
  removed: boolean[]      // dihapus aturan X9
  classes: BidiClass[]    // Bidi_Class asli
  paragraphs: { start: number; end: number; level: number }[]
}
```

## 3. Contoh tata letak per baris

```ts
const r = resolveLevels(paragraph, { direction: 'auto' })
for (const [start, end] of lineBreaks) {
  const order = visualOrder(r, start, end)   // gambar glyph sesuai urutan ini
}
```
