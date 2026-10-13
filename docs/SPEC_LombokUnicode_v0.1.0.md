# LombokUnicode — SPEC v0.1.0

This document is the normative cross-language contract. Every language port MUST produce byte-identical output for all specified inputs. Deviations from this specification are bugs.

| Atribut | Nilai |
|---|---|
| Versi SPEC | 0.1.0 (berlaku untuk paket `lombokunicode` 0.1.x) |
| Standar acuan | Unicode 17.0.0; UAX #9 Unicode Bidirectional Algorithm revisi untuk Unicode 17.0.0 |
| Data | `data/ucd-17.0.0/`: `DerivedBidiClass.txt`, `BidiMirroring.txt`, `BidiBrackets.txt` (tabel dibangkitkan `scripts/gen_data.py`) |
| Suite kesesuaian | `BidiTest.txt` (semua baris, ketiga arah paragraf; lebih dari 700 000 kasus) dan `BidiCharacterTest.txt` (lebih dari 90 000 kasus) Unicode 17.0.0 |
| Vector | `vectors/lombokunicode-vectors-v1.json`: 181 kasus (levels 102, class 34, visual 16, mirror 11, bracket 10, direction 8). SHA-256 `434cea2aacb028b0784dec66ef5c854b3d8905584a5fcf9287096591bdf9d67d` |
| Referensi | TypeScript (`src/`) |
| Tanggal tinjauan | 2026-10-11 |

Kata MUST, MUST NOT, SHOULD, MAY mengikuti RFC 2119. Semua indeks dan panjang dihitung dalam code point.

## 1. Ruang lingkup

Versi 0.1.0 mencakup properti dua arah dan UAX #9 lengkap (P1-P3, X1-X10, W1-W7, N0-N2, I1-I2, L1-L2, L4 untuk mirroring). Segmentasi (UAX #29), pemenggalan baris (UAX #14), normalisasi (UAX #15), dan properti lain direncanakan di versi berikutnya. Shaping dan pemilihan glyph berada di luar library ini.

## 2. Properti karakter

1. `bidiClass(cp)` MUST mengembalikan Bidi_Class Unicode 17.0.0, termasuk nilai bawaan `@missing` untuk code point yang belum ditetapkan (misalnya U+0378 adalah `L`, U+05FF adalah `R`, U+07BF adalah `AL`, U+20CF adalah `ET`). Nama kelas memakai singkatan UCD; urutan tabel: `L R AL EN ES ET AN CS NSM BN B S WS ON LRE LRO RLE RLO PDF LRI RLI FSI PDI`.
2. `mirrorOf(cp)` MUST mengembalikan Bidi_Mirroring_Glyph dari `BidiMirroring.txt`, atau null.
3. `pairedBracket(cp)` MUST mengembalikan Bidi_Paired_Bracket dan tipe `open`/`close` dari `BidiBrackets.txt`, atau null.
4. Nilai di luar 0..0x10FFFF atau bukan bilangan bulat MUST ditolak (TypeScript: `RangeError`).

## 3. Algoritma dua arah

1. Masukan: deretan code point (atau deretan Bidi_Class untuk `resolveClasses`) dan arah paragraf `ltr` (level 0), `rtl` (level 1), atau `auto` (P2-P3; tanpa karakter kuat menjadi level 0). Bawaan `auto`.
2. Paragraf dipisah pada setiap karakter kelas B; pemisah termasuk paragraf sebelumnya. Masukan kosong menghasilkan satu paragraf kosong.
3. Hasil MUST sama dengan UAX #9 untuk setiap kasus `BidiTest.txt` dan `BidiCharacterTest.txt`: level per karakter setelah L1 untuk karakter yang tidak dihapus X9, dan urutan visual (L2) tanpa karakter yang dihapus X9. Tanpa code point (`resolveClasses` tanpa argumen ketiga) aturan N0 tidak berlaku, sesuai `BidiTest.txt`.
4. Karakter yang dihapus X9 (kelas RLE, LRE, RLO, LRO, PDF, BN) mendapat level karakter tersisa terdekat sebelumnya dalam paragraf, atau level paragraf bila tidak ada; `removed` bernilai true untuk karakter itu.
5. Batas kedalaman eksplisit 125 (BD2) dan tumpukan pasangan kurung 63 (BD16) MUST diterapkan seperti UAX #9. U+2329/U+232A setara dengan U+3008/U+3009 saat mencocokkan kurung.
6. `lineLevels(result, start, end)` menerapkan L1 pada satu baris di dalam satu paragraf: kelas S dan B, serta deretan WS/isolate/karakter-X9 di akhir baris atau sebelum S/B, menjadi level paragraf. Baris yang melintasi paragraf MUST ditolak.
7. `visualOrder(result, start, end, keepRemoved = false)` mengembalikan indeks logis dari kiri ke kanan menurut L2.
8. Waktu proses MUST linear terhadap panjang masukan (tidak ada jalur kuadratik pada deretan angka, karakter format, isolate, atau kurung).

## 4. Teks visual

`toVisual(text, { direction, mirror = true })` memperlakukan setiap paragraf sebagai satu baris: urutan visual (3.7), karakter yang dihapus X9 dibuang, karakter pada level ganjil diganti Bidi_Mirroring_Glyph bila `mirror` (L4), dan pemisah paragraf tetap di akhir paragrafnya. Fungsi ini untuk keluaran sederhana tanpa pemenggalan baris; tata letak bertingkat memakai `resolveLevels`, `lineLevels`, dan `visualOrder` per baris.

## 5. Arah paragraf

`detectDirection(text)` mengembalikan `rtl` atau `ltr` menurut karakter kuat pertama di luar isolate (P2-P3), atau null bila tidak ada.

## 6. Vector

Setiap kasus memuat `fn` (`class`, `mirror`, `bracket`, `levels`, `visual`, `direction`), `input`, dan `expected`. Kasus `levels` diambil dari `BidiCharacterTest.txt` (setiap baris ke-900) dengan `levels` berupa string (`x` untuk karakter yang dihapus) dan `order`. Setiap port MUST menjalankan semua kasus dan kedua berkas kesesuaian Unicode.
