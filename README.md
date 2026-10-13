# LombokUnicode

> The Unicode Bidirectional Algorithm (UAX #9) for Unicode 17.0.0 with Bidi_Class, mirroring, and paired-bracket data. Passes every case of the official BidiTest and BidiCharacterTest files. Zero dependencies.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![UAX #9](https://img.shields.io/badge/BidiTest-700k%2B%20cases-success)](tests/conformance.test.ts)
[![Unicode](https://img.shields.io/badge/Unicode-17.0.0-informational)](data/ucd-17.0.0)

Part of the [Lombok Ecosystem](https://github.com/codinglombok).

## Mengapa library ini? (Why this library?)

- **Complete and checked.** All rules of UAX #9 including isolates (LRI, RLI, FSI, PDI), overflow handling, and bracket pairs (N0). Every line of the Unicode 17.0.0 `BidiTest.txt` (in all three paragraph directions) and `BidiCharacterTest.txt` runs in CI.
- **Same answer in every language.** One generated table set and one normative [SPEC](docs/SPEC_LombokUnicode_v0.1.0.md) with 181 shared vectors, so a server in one language and a client in another order mixed Arabic, Hebrew, and Latin text identically.
- **Small and fast.** 16 KB of data, linear time on adversarial input (long digit runs, thousands of unmatched isolates or embeddings), no dependencies.
- **Usable at every level.** Character properties, embedding levels, per-line reordering for layout engines, and a one-call `toVisual` for simple output such as logs, terminals, and basic PDF text.

## Installation

```bash
npm install lombokunicode
```

Not yet published to npm. Rust, Python, Go, and PHP ports are planned and will run the same tables and test files.

## Quick start

```ts
import { bidiClass, detectDirection, resolveLevels, toVisual, visualOrder } from 'lombokunicode'

bidiClass(0x05d0)                 // 'R'
detectDirection('مرحبا world')     // 'rtl'
toVisual('שלום (world) 123')       // characters in display order, brackets mirrored

const text = 'abc אבג 123'
const r = resolveLevels(text, { direction: 'ltr' })
r.levels                           // embedding level per code point
visualOrder(r, 0, [...text].length) // logical indices from left to right
```

## Documentation

[SPEC](docs/SPEC_LombokUnicode_v0.1.0.md) (normative), [API](docs/API_LombokUnicode_v0.1.0.md), [Guide](docs/guide_how_to_use_LombokUnicode_v0.1.0.md), [Map](docs/map_LombokUnicode_v0.1.0.md), [Structure](docs/structure_repo_LombokUnicode_v0.1.0.md), [Summary](docs/full_summary_project_LombokUnicode_v0.1.0.md), [Development](docs/development_ide_LombokUnicode_v0.1.0.md), [Distribution](docs/how_to_dist_LombokUnicode_v0.1.0.md), [Languages](docs/Lang_LombokUnicode_v0.1.0.md), [Changelog](docs/changelog_LombokUnicode_v0.1.0.md).

## License

Apache-2.0. Unicode data and test files are under the Unicode License v3; see [NOTICE](NOTICE).
