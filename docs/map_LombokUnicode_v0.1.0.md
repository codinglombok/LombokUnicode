# LombokUnicode — Map v0.1.0

## 1. Posisi di ekosistem

```
Cluster 03 Format, Parser & Serialisasi · tingkat L0 (tanpa dependensi Lombok wajib)

L0  LombokUnicode
     dependensi wajib    : (tidak ada)
     data tertanam       : Unicode Character Database 17.0.0 (Bidi_Class, mirroring, kurung berpasangan)
     dependensi dev      : typescript, vitest, tsup; Python 3 untuk pembangkit data dan vector
```

Nomor katalog dan posisi cluster mengikuti dokumen induk ekosistem v3.6 (tidak di-commit, ADR-024).

## 2. Contoh pemakai di ekosistem

Bagian ini satu-satunya tempat nama aplikasi atau framework boleh muncul (ADR-019). Ini ilustrasi, bukan kepemilikan.

| Pemakai | Jenis | Status | Pemakaian |
|---|---|---|---|
| LombokPDF | Produk L3 | rencana (F2) | urutan visual teks Arab/Ibrani di PDF, mengganti resolver heuristik |
| LombokLayout | Library L2 | rencana | level per baris untuk tata letak |
| LombokShape | Library L2 | rencana | run arah untuk shaping |
| LombokHTML, LombokMarkDown | Library L0 | opsional | atribut `dir="auto"` |

## 3. Fitur x port

| Fitur | TypeScript | Rust | Python | Go | PHP |
|---|---|---|---|---|---|
| properti (SPEC §2) | YA | rencana | rencana | rencana | rencana |
| UAX #9 (§3) | YA | rencana | rencana | rencana | rencana |
| BidiTest / BidiCharacterTest | lulus | - | - | - | - |
| vector | 181/181 | - | - | - | - |

## 4. Rencana versi

0.2.0 segmentasi grapheme/kata/kalimat (UAX #29); 0.3.0 pemenggalan baris (UAX #14); 0.4.0 normalisasi (UAX #15), East Asian Width, Script.

## 5. Jalur kontrak normatif

`docs/SPEC_LombokUnicode_v0.1.0.md` -> `vectors/lombokunicode-vectors-v1.json` (sha256 di SPEC) -> runner `tests/vectors.test.ts`; kesesuaian `tests/conformance.test.ts`.
