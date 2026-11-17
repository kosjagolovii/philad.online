#!/usr/bin/env python3
"""Сторінки за адресами старого philad.org: головний файл (about.html …) → копія за чистою адресою (pro-nas/index.html …).
Таблиця адрес — urlmap.py. Копія отримує <base href="/"> (щоб усі відносні шляхи працювали на будь-якій глибині) і скрипт components/base-fix.js.
Головний файл лишається для редагування, але для пошуковиків закривається (noindex) — індексується лише копія.
Служіння зі старими сторінками /project/<slug>/ — копії ministry.html з window.MIN_ID.
Запуск:  python3 build-urls.py   (його викликає seo-apply.py наприкінці — окремо запускати не треба)"""
import re, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from urlmap import CLEAN

ROOT = pathlib.Path(__file__).resolve().parent
SITE = "https://philad.org"
BASE = '<base href="/">\n<script src="/components/base-fix.js"></script>\n'
IDX = '<meta name="robots" content="index,follow,max-image-preview:large">'
NOIDX = '<meta name="robots" content="noindex,follow">'

def retarget(s, path, extra=""):
    s = re.sub(r'<meta name="robots" content="[^"]*">', IDX, s, count=1)
    canon = f"{SITE}/{path}/"
    s = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{canon}">', s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*(">)', rf'\g<1>{canon}\g<2>', s, count=1)
    if "<base " not in s:
        s = re.sub(r"(<meta charset=[^>]*>[^\n]*\n?)", lambda m: m.group(1) + ("\n" if not m.group(1).endswith("\n") else "") + BASE + extra, s, count=1)
    return s

def write(path, html):
    d = ROOT / path; d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(html, "utf-8")

def main():
    n = 0
    for f, path in CLEAN.items():
        src = ROOT / f
        if not src.exists(): continue
        s = src.read_text("utf-8")
        write(path, retarget(s, path)); n += 1
        if '<meta name="robots"' in s:                               # головний файл — не для індексації
            src.write_text(re.sub(r'<meta name="robots" content="[^"]*">', NOIDX, s, count=1), "utf-8")
    mp = ROOT / "min" / "data.js"
    slugs = json.loads(re.search(r"PHILAD_MIN_SLUGS=(\{.*?\});", mp.read_text("utf-8")).group(1))
    m = (ROOT / "ministry.html").read_text("utf-8")
    for mid, slug in slugs.items():
        write(f"project/{slug}", retarget(m, f"project/{slug}", f'<script>window.MIN_ID="{mid}"</script>\n')); n += 1
    print(f"сторінок за адресами старого сайту: {n}")

if __name__ == "__main__": main()
