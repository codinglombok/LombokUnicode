# LombokUnicode — How to Dist v0.1.0

| Bahasa | Paket | Status |
|---|---|---|
| TypeScript | `lombokunicode` (npm) | belum terbit |
| Rust, Python, Go, PHP | - | rencana |

Alur rilis: `npm run check` lulus; versi manifest, nama dokumen, dan CHANGELOG sama; bila data atau vector berubah jalankan `npm run data` dan `npm run vectors`, lalu perbarui SHA-256 di SPEC; tag `vX.Y.Z`.

Saat Unicode merilis versi baru: ganti berkas di `data/` dan `tests/fixtures/`, `npm run data`, jalankan kesesuaian, naikkan versi minor.
