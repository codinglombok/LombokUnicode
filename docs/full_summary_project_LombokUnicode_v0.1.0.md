# LombokUnicode — Full Summary Project v0.1.0

## 1. Tabel gap vs pembanding (jujur)

| Aspek | LombokUnicode 0.1.0 | ICU / ICU4X | fribidi | bidi-js | unicode-bidi (Rust) |
|---|---|---|---|---|---|
| Versi Unicode | 17.0.0 | terbaru | bergantung rilis | 13-ish | bergantung rilis |
| BidiTest + BidiCharacterTest | lulus semua | lulus | lulus | sebagian | lulus |
| Bahasa | TS (port lain rencana) | C/C++/Java/Rust | C | JS | Rust |
| Ukuran data | 16 KB | besar | kecil | kecil | kecil |
| Kontrak lintas bahasa + vector | ya | tidak | tidak | tidak | tidak |
| Segmentasi, line break, normalisasi | belum | ya | tidak | tidak | tidak |

## 2. Batasan yang diketahui

- Hanya port TypeScript.
- Hanya UAX #9 dan properti dua arah pada 0.1.0.
- `toVisual` memperlakukan paragraf sebagai satu baris; pemenggalan baris tanggung jawab pemanggil.

## 3. Prinsip Universal (ringkas, untuk publik)

Mandiri dan tanpa dependensi; dipakai siapa pun; perilaku ditetapkan SPEC normatif, data UCD yang dipatok versinya, dan vector bersama; waktu linear; lisensi Apache-2.0 dengan data Unicode di bawah Unicode License v3.
