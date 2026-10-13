# LombokUnicode — Bahasa & i18n v0.1.0

## 1. Aksara

Data mencakup seluruh Unicode 17.0.0: Arab, Ibrani, Suryani, Thaana, N'Ko, Samaritan, Mandaic, Adlam, Hanifi Rohingya, dan aksara RTL lain, serta angka Arab-Indic (kelas AN) dan Eropa (EN).

## 2. Batasan

Library ini menentukan urutan tampilan, bukan bentuk huruf. Bentuk sambung huruf Arab (shaping) dilakukan oleh mesin shaping; tanpa itu teks Arab urutannya benar tetapi hurufnya berbentuk tunggal.

## 3. Pesan galat

Hanya `RangeError` untuk code point tidak sah dan baris yang melintasi paragraf; pesan berbahasa Inggris.
