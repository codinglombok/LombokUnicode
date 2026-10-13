# LombokUnicode — Structure Repo v0.1.0

```
LombokUnicode/
├── src/
│   ├── index.ts           API publik
│   ├── bidi.ts            UAX #9 dan properti (SPEC §2-5)
│   └── bidi-data.ts       tabel hasil pembangkit (jangan disunting)
├── data/ucd-17.0.0/       berkas UCD sumber tabel
├── scripts/
│   ├── gen_data.py        UCD -> src/bidi-data.ts
│   └── lombok-doctor.sh
├── tests/
│   ├── conformance.test.ts    BidiTest.txt dan BidiCharacterTest.txt
│   ├── vectors.test.ts        runner vector bersama
│   ├── api.test.ts            API, kasus tepi, kasus terburuk
│   └── fixtures/ucd-17.0.0/   berkas uji resmi Unicode
├── vectors/               build_vectors.py, berkas vector, SHA256SUMS
├── docs/                  10 dokumen publik
└── CLAUDE.md, README.md, NOTICE, CHANGELOG.md, LICENSE, package.json, tsconfig.json, vitest.config.ts
```
