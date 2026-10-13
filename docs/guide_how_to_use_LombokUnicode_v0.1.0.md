# LombokUnicode — Guide How to Use v0.1.0

## 1. Pemasangan

`npm install lombokunicode` (setelah terbit).

## 2. Keluaran sederhana (log, terminal, PDF tanpa tata letak)

```ts
toVisual(text, { direction: 'auto' })
```

## 3. Mesin tata letak

1. `resolveLevels(paragraphText, { direction })` sekali per paragraf.
2. Pecah baris sesuai lebar (memakai urutan logis).
3. Untuk setiap baris `visualOrder(result, start, end)`; ganti glyph karakter pada level ganjil dengan `mirrorOf` bila font tidak melakukannya.

## 4. Menentukan `dir` HTML

`detectDirection(text) ?? 'ltr'`.

## 5. Skenario

Dokumen PDF berbahasa Arab/Ibrani, editor teks, terminal, label dan struk, pratinjau email, penyandian teks untuk perangkat tampilan sederhana.
