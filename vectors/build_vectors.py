#!/usr/bin/env python3
"""Build vectors/lombokunicode-vectors-v1.json.

Expected values come from the Unicode Character Database 17.0.0 files (data/ and
tests/fixtures/) or are derived by hand from the SPEC; none are copied from an
implementation's output.

Case kinds (field "fn"):
  class      {"cp"}                     -> Bidi_Class name
  mirror     {"cp"}                     -> mirror code point or null
  bracket    {"cp"}                     -> {"pair", "type"} or null
  levels     {"cps", "direction"}       -> {"paragraphLevel", "levels" (after L1, "x" = removed), "order"}
  visual     {"text", "direction"}      -> string
  direction  {"text"}                   -> "ltr" | "rtl" | null
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
UCD = ROOT / "data" / "ucd-17.0.0"
FIX = ROOT / "tests" / "fixtures" / "ucd-17.0.0"
CASES = []

LONG = {
    "Left_To_Right": "L", "Right_To_Left": "R", "Arabic_Letter": "AL", "European_Terminator": "ET",
}


def ucd_class_table():
    text = (UCD / "DerivedBidiClass.txt").read_text(encoding="utf-8")
    explicit = {}
    for line in text.splitlines():
        body = line.split("#", 1)[0].strip()
        if not body:
            continue
        rng, cls = [x.strip() for x in body.split(";")]
        a, _, b = rng.partition("..")
        for cp in range(int(a, 16), int(b or a, 16) + 1):
            explicit[cp] = cls
    missing = [(int(a, 16), int(b, 16), LONG[c]) for a, b, c in
               re.findall(r"^# @missing: ([0-9A-F]+)\.\.([0-9A-F]+); (\w+)", text, re.M)]

    def lookup(cp):
        if cp in explicit:
            return explicit[cp]
        cls = None
        for a, b, c in missing:
            if a <= cp <= b:
                cls = c
        return cls
    return lookup


def pairs(name, fields):
    out = {}
    for line in (UCD / name).read_text(encoding="utf-8").splitlines():
        body = line.split("#", 1)[0].strip()
        if body:
            parts = [x.strip() for x in body.split(";")]
            out[int(parts[0], 16)] = parts[1:fields]
    return out


def add(id, fn, inp, expected):
    CASES.append({"id": id, "fn": fn, "input": inp, "expected": expected})


def main():
    cls = ucd_class_table()
    # 1. Bidi_Class: one or more code points of every class, plus defaults for unassigned code points
    for cp in [0x41, 0x5D0, 0x627, 0x30, 0x2B, 0x24, 0x660, 0x2C, 0x300, 0xAD, 0x0A, 0x09, 0x20, 0x21,
               0x202A, 0x202D, 0x202B, 0x202E, 0x202C, 0x2066, 0x2067, 0x2068, 0x2069,
               0x0378, 0x05FF, 0x07BF, 0x08FF, 0x20CF, 0xFDD0, 0x10FFFF, 0x1EFFF, 0x0E00, 0x1F600, 0x10D40]:
        add(f"class-{cp:04X}", "class", {"cp": cp}, cls(cp))

    mir = pairs("BidiMirroring.txt", 2)
    for cp in [0x28, 0x29, 0x3C, 0x5B, 0x7B, 0x2208, 0x2264, 0x300C, 0xFF08, 0x41, 0x2329]:
        add(f"mirror-{cp:04X}", "mirror", {"cp": cp}, int(mir[cp][0], 16) if cp in mir else None)

    brk = pairs("BidiBrackets.txt", 3)
    for cp in [0x28, 0x29, 0x5B, 0x5D, 0x7B, 0x2329, 0x3008, 0xFF62, 0x3C, 0x41]:
        b = brk.get(cp)
        add(f"bracket-{cp:04X}", "bracket", {"cp": cp},
            {"pair": int(b[0], 16), "type": "open" if b[1] == "o" else "close"} if b else None)

    # 2. Levels and order: every 900th line of BidiCharacterTest.txt (official expected values)
    n = 0
    for line in (FIX / "BidiCharacterTest.txt").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        n += 1
        if n % 900 != 1:
            continue
        cps, d, para, levels, order = line.split(";")
        add(f"levels-bct-{n}", "levels",
            {"cps": [int(h, 16) for h in cps.split()], "direction": {"0": "ltr", "1": "rtl", "2": "auto"}[d]},
            {"paragraphLevel": int(para), "levels": levels.split(), "order": [int(x) for x in order.split()]})

    # 3. Visual strings (derived by hand from SPEC 4)
    he = "אבג"          # alef bet gimel
    ar = "الس"          # alef lam seen
    visual = [
        ("ascii", "abc def", "auto", "abc def"),
        ("hebrew-word", he, "auto", "גבא"),
        ("arabic-word", ar, "auto", "سلا"),
        ("hebrew-in-latin", "a " + he + " b", "ltr", "a גבא b"),
        ("latin-in-hebrew", he + " abc", "auto", "abc גבא"),
        ("numbers-keep-order-rtl", he + " 123", "auto", "123 גבא"),
        ("parens-mirror-rtl", he + " (x)", "rtl", "(x) גבא"),
        ("parens-around-hebrew", "(" + he + ")", "rtl", "(גבא)"),
        ("forced-ltr-hebrew-only", he, "ltr", "גבא"),
        ("forced-rtl-latin-one-run", "abc def", "rtl", "abc def"),
        ("rtl-latin-then-hebrew", "abc " + he, "rtl", "\u05D2\u05D1\u05D0 abc"),
        ("two-paragraphs", he + "\nabc", "auto", "גבא\nabc"),
        ("controls-dropped", "a‫b‬c", "ltr", "abc"),
        ("rlo-override", "‮abc‬", "ltr", "cba"),
        ("empty", "", "auto", ""),
        ("mirror-less-than-rtl", he + "<" + he, "rtl", "גבא>גבא"),
    ]
    for id, text, d, expected in visual:
        add(f"visual-{id}", "visual", {"text": text, "direction": d}, expected)

    # 4. Paragraph direction (P2-P3)
    for id, text, expected in [
        ("latin", "abc", "ltr"), ("hebrew", he, "rtl"), ("arabic", ar, "rtl"),
        ("digits-only", "123", None), ("punct-then-hebrew", "!? " + he, "rtl"),
        ("isolate-skipped", "⁧abc⁩" + he, "rtl"), ("empty", "", None),
        ("latin-then-hebrew", "a" + he, "ltr"),
    ]:
        add(f"direction-{id}", "direction", {"text": text}, expected)

    ids = [c["id"] for c in CASES]
    assert len(ids) == len(set(ids))
    doc = {"library": "LombokUnicode", "version": "1", "unicode": "17.0.0",
           "spec": "docs/SPEC_LombokUnicode_v0.1.0.md", "cases": CASES}
    path = ROOT / "vectors" / "lombokunicode-vectors-v1.json"
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    (ROOT / "vectors" / "SHA256SUMS").write_text(f"{digest}  vectors/{path.name}\n", encoding="utf-8")
    print(f"{len(CASES)} cases, sha256 {digest}")


if __name__ == "__main__":
    main()
