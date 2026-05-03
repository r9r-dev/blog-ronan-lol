#!/usr/bin/env python3
"""
Extract Canela Deck and Canela Text from macOS system .ttc files
and emit .woff2 files into public/fonts/.

Apple's macOS catalog ships Canela in Regular / Medium / Bold weights
(plus their italics) — not Light/SemiBold. The wanted map below targets
those available faces.

Requires: pip install fonttools brotli
"""

import sys
from pathlib import Path
from fontTools.ttLib import TTFont, TTCollection
from fontTools.ttLib.woff2 import compress

CANELA_DECK_TTC = Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8/da24bc1aaf401b7c6b06ee39b4d3891cfcc0b6dc.asset/AssetData/CanelaDeck.ttc')
CANELA_TEXT_TTC = Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8/9fc2ae4384380361a3bccc581eda12aa8ceca958.asset/AssetData/CanelaText.ttc')

DECK_WANTED = {
    'CanelaDeck-Regular':  'CanelaDeck-Regular',
    'CanelaDeck-Medium':   'CanelaDeck-Medium',
    'CanelaDeck-Bold':     'CanelaDeck-Bold',
}

TEXT_WANTED = {
    'CanelaText-Regular':       'CanelaText-Regular',
    'CanelaText-Italic':        'CanelaText-Italic',
    'CanelaText-RegularItalic': 'CanelaText-Italic',
    'CanelaText-Medium':        'CanelaText-Medium',
    'CanelaText-Bold':          'CanelaText-Bold',
}

OUT_DIR = Path(__file__).resolve().parent.parent / 'public' / 'fonts'


def ps_name(font: TTFont) -> str:
    name_table = font['name']
    rec = name_table.getName(6, 3, 1) or name_table.getName(6, 1, 0)
    return str(rec) if rec else ''


def emit(ttc_path: Path, wanted: dict[str, str]) -> int:
    if not ttc_path.exists():
        print(f'  missing: {ttc_path}', file=sys.stderr)
        return 0
    coll = TTCollection(str(ttc_path))
    written = 0
    seen = set()
    for font in coll.fonts:
        ps = ps_name(font)
        if ps in wanted and wanted[ps] not in seen:
            stem = wanted[ps]
            out = OUT_DIR / f'{stem}.woff2'
            tmp_ttf = OUT_DIR / f'{stem}.ttf'
            font.flavor = None
            font.save(str(tmp_ttf))
            compress(str(tmp_ttf), str(out))
            tmp_ttf.unlink()
            seen.add(stem)
            written += 1
            print(f'  {ps} -> {out.name}')
    return written


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print('Extracting Canela Deck:')
    n1 = emit(CANELA_DECK_TTC, DECK_WANTED)
    print('Extracting Canela Text:')
    n2 = emit(CANELA_TEXT_TTC, TEXT_WANTED)
    total = n1 + n2
    print(f'\nWrote {total} font files to {OUT_DIR}')
    return 0 if total >= 5 else 1


if __name__ == '__main__':
    sys.exit(main())
