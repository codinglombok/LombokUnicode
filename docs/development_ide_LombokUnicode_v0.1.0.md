# LombokUnicode — Development IDE v0.1.0

## 1. Lingkungan

Node.js 20+, Python 3.10+.

## 2. Perintah

| Perintah | Fungsi |
|---|---|
| `npm test` | semua tes, termasuk kesesuaian Unicode |
| `npm run coverage` | tes dengan ambang cakupan |
| `npm run lint` | pemeriksaan tipe |
| `npm run data` | bangun ulang `src/bidi-data.ts` dari `data/` |
| `npm run vectors` | bangun ulang vector dan SHA256SUMS |
| `npm run check` | lint, cakupan, build, lombok doctor |

## 3. Alur mengubah perilaku

SPEC dulu, lalu `vectors/build_vectors.py` (nilai harapan dari data Unicode atau ditulis tangan), lalu implementasi. Setiap perubahan harus tetap lulus kedua berkas kesesuaian Unicode.
