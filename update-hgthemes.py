#!/usr/bin/env python3
"""Сторінка «Теми домашніх груп»: збирає теми зі старого сайту philad.org/category/homegroups_themes/
і складає hgthemes/data.json (+ data.js для відкриття без сервера).

Для кожної теми: назва, дата, посилання, мітки (теги WordPress), книги Біблії з віршів (📖), кількість питань.
Мітки приводяться до єдиного словника (hgthemes/tags.json); теми без міток отримують релевантні за ключовими
словами з назви й тексту — так нова тема завжди потрапляє у фільтри.

Вже зібрані теми беруться з кешу hgthemes/cache.json, тож регулярний запуск довантажує лише нові:
    python3 update-hgthemes.py            # щодня
    python3 update-hgthemes.py --images   # перевірити ілюстрації всіх тем (довантажити відсутні)
    python3 update-hgthemes.py --full     # перезібрати все з нуля
"""
import json, re, sys, time, html, pathlib, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "hgthemes"
START = "https://philad.org/category/homegroups_themes/"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36", "Accept-Language": "uk-UA,uk;q=0.9"}

def get(url):
    url = urllib.parse.quote(url, safe=":/?&=%#")      # на сайті є адреса з невидимим символом — кодуємо її
    for i in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode("utf-8", "ignore")
        except Exception:
            time.sleep(1.5 * (i + 1))
    raise RuntimeError("не вдалося завантажити " + url)

def clean(s):
    t = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()
    return re.sub(r"\s+([,.;:!?»”’)\]])", r"\1", t)

def list_pages(known, scan_all=False):
    """Посилання на теми й їхні ілюстрації зі сторінок категорії; зупиняємось, коли ціла сторінка вже відома (для щоденного запуску)."""
    url, found, pages, imgs = START, [], 0, {}
    while url:
        h = get(url); pages += 1
        for art in re.findall(r"<article[\s\S]*?</article>", h):
            m = re.search(r'<h\d[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)</a>', art)
            if not m: continue
            im = re.search(r'class="post-thumb"[\s\S]*?<img src="([^"]+)"', art)
            if im: imgs[m.group(1)] = im.group(1)
        items = re.findall(r'<h\d[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)</a>', h)
        new = [(u, clean(t)) for u, t in items if u not in known]
        found += new
        if known and not new and not scan_all: break
        n = re.findall(r'<link rel=.next. href="([^"]+)"', h)
        url = n[0] if n else None
        time.sleep(0.25)
    print(f"сторінок категорії: {pages}, нових тем: {len(found)}, ілюстрацій: {len(imgs)}")
    return found, imgs

def full_size(u):
    """Мініатюра WordPress …-950x320.jpg → оригінал …jpg"""
    return re.sub(r"-\d+x\d+(\.\w+)$", r"\1", u)

def download_images(cache):
    """Ілюстрації тем → hgthemes/img/<хеш>.webp (480 px заввишки 16:10 — для карток); вже завантажені пропускаємо."""
    import hashlib, io
    from PIL import Image, ImageOps
    d = OUT / "img"; d.mkdir(exist_ok=True)
    def one(r):
        src = r.get("imgsrc")
        if not src: return
        name = hashlib.sha1(src.encode()).hexdigest()[:12] + ".webp"
        r["img"] = "hgthemes/img/" + name
        if (d / name).exists(): return
        for u in (full_size(src), src):
            try:
                raw = urllib.request.urlopen(urllib.request.Request(urllib.parse.quote(u, safe=":/?&=%#"), headers=UA), timeout=40).read()
                im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
                im = ImageOps.fit(im, (720, 450), Image.LANCZOS, centering=(0.5, 0.4))
                im.save(d / name, "WEBP", quality=76, method=5); return
            except Exception:
                continue
        r["img"] = None
        print("не вдалося завантажити зображення:", src, file=sys.stderr)
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(one, cache.values()))

BOOKS = ["Буття","Вихід","Левит","Числа","Повторення Закону","Ісус Навин","Суддів","Рут","1 Самуїла","2 Самуїла","1 Царів","2 Царів","1 Хронік","2 Хронік","Ездра","Неемії","Естер","Йова","Псалми","Приповідки","Екклезіяст","Пісня Над Піснями","Ісаї","Єремії","Плач Єремії","Єзекіїля","Даниїла","Осії","Йоїла","Амоса","Овдія","Йони","Михея","Наума","Авакума","Софонії","Огія","Захарії","Малахії",
         "Матвія","Марка","Луки","Івана","Дії","Римлян","1 Коринтян","2 Коринтян","Галатів","Ефесян","Филип","Колосян","1 Солунян","2 Солунян","1 Тимофія","2 Тимофія","Тита","Филимона","Євреїв","Якова","1 Петра","2 Петра","1 Івана","2 Івана","3 Івана","Юди","Об","Одкровення"]
NT_FROM = BOOKS.index("Матвія")
BOOK_RE = re.compile(r"(?<![А-Яа-яІіЇїЄє])((?:[123]\s*)?(?:Буття|Вихід|Левит|Числ|Повторення Закону|Ісуса? Навина?|Суддів|Рут|Самуїла|Царів|Хронік|Ездр|Неемії|Естер|Йова|Псалм\w*|Приповід\w*|Екклезіяст\w*|Пісн\w* Над Піснями|Ісаї|Єремії|Плач Єремії|Єзекіїля|Даниїла|Осії|Йоїла|Амоса|Овдія|Йони|Михея|Наума|Авакума|Софонії|Огія|Захарії|Малахії|Матвія|Марка|Луки|Івана|Дії\w*|Римлян|Коринтян|Галатів|Ефесян|Филип\w*|Колосян|Солунян|Тимофія|Тита|Филимона|Євреїв|Якова|Петра|Юди|Об'явлення|Об’явлення|Одкровення))\s*(\d+)\s*[:,]\s*\d")
def norm_book(raw):
    r = re.sub(r"\s+", " ", raw.strip())
    m = re.match(r"([123])\s*(.*)", r)
    num, name = (m.group(1), m.group(2)) if m else ("", r)
    rep = {"Числ":"Числа","Ісус Навина":"Ісус Навин","Ісуса Навина":"Ісус Навин","Ісуса Навин":"Ісус Навин","Дії":"Дії","Об'явлення":"Одкровення","Об’явлення":"Одкровення"}
    for k, v in rep.items():
        if name.startswith(k): name = v; break
    if name.startswith("Псалм"): name = "Псалми"
    if name.startswith("Приповід"): name = "Приповідки"
    if name.startswith("Екклезіяст"): name = "Екклезіяст"
    if name.startswith("Пісн"): name = "Пісня Над Піснями"
    if name.startswith("Дії"): name = "Дії"
    if name.startswith("Филип"): name = "Филип’ян" if not name.startswith("Филимона") else name
    return (num + " " + name).strip()

_TP = []
def parse_doc(raw):
    """Структурований текст теми (для сторінки теми): див. hgthemes/theme_parse.py"""
    if not _TP:
        import importlib.util
        spec = importlib.util.spec_from_file_location("theme_parse", ROOT / "hgthemes" / "theme_parse.py")
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); _TP.append(m)
    return _TP[0].parse_theme_body(raw)["sections"]

RAW_FILE = ROOT / "hgthemes" / "raw.json.gz"
RAW = {}
def _load_raw():
    import gzip
    if RAW_FILE.exists(): RAW.update(json.loads(gzip.open(RAW_FILE, "rt", encoding="utf-8").read()))
def _save_raw():
    import gzip
    with gzip.open(RAW_FILE, "wt", encoding="utf-8") as f: json.dump(RAW, f, ensure_ascii=False)

def fill_docs(cache, force=False, reparse=False):
    """Темам із кешу, у яких ще немає структурованого тексту, довантажує його."""
    todo = [r for r in cache.values() if force or "doc" not in r]
    if not todo: return
    _load_raw()
    def one(r):
        try:
            body = RAW.get(r["url"]) if reparse and r["url"] in RAW else None
            if body is None:
                h = get(r["url"]); m = re.search(r'<div class="entry-content">([\s\S]*?)<!-- \.entry-content -->', h)
                body = m.group(1) if m else ""; RAW[r["url"]] = body; time.sleep(0.15)
            r["doc"] = parse_doc(body)
        except Exception as e:
            print("без тексту:", r["url"], e, file=sys.stderr)
    with ThreadPoolExecutor(4) as ex: list(ex.map(one, todo))
    _save_raw()
    print("структуровано тексту тем:", len(todo))
    if _TP: print("автоправки тексту:", _TP[0].STATS)

def download_body_images(cache):
    """Фото всередині тексту тем → hgthemes/img/body/<хеш>.webp (до 1200 px завширшки); у блоки додається поле «local»."""
    import hashlib, io
    from PIL import Image, ImageOps
    d = OUT / "img" / "body"; d.mkdir(parents=True, exist_ok=True)
    seen = {}
    def todo():
        for r in cache.values():
            doc = r.get("doc") or {}
            for k in ("recap", "intro", "conclusion", "challenge", "rest"):
                for b in doc.get(k, []):
                    if b.get("t") == "img": yield b
            for p_ in doc.get("points", []):
                for b in p_["blocks"]:
                    if b.get("t") == "img": yield b
    blocks = list(todo())
    def one(b):
        src = b["src"]
        name = hashlib.sha1(src.encode()).hexdigest()[:12] + ".webp"
        if (d / name).exists(): b["local"] = "hgthemes/img/body/" + name; return
        try:
            u = src if src.startswith("http") else urllib.parse.urljoin("https://philad.org/", src)
            raw = urllib.request.urlopen(urllib.request.Request(urllib.parse.quote(u, safe=":/?&=%#"), headers=UA), timeout=40).read()
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
            if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
            im.save(d / name, "WEBP", quality=80, method=5); b["local"] = "hgthemes/img/body/" + name
        except Exception as e:
            print("не вдалося завантажити фото з тексту:", src, file=sys.stderr)
    with ThreadPoolExecutor(6) as ex: list(ex.map(one, blocks))
    print("фото в текстах тем:", len(blocks))

def parse_theme(url, title, page):
    date = (re.search(r'<time[^>]*datetime="([^"]+)"', page) or [None, None])[1]
    tags = [clean(t) for t in re.findall(r'rel="tag"[^>]*>([^<]+)<', page)]
    body = re.search(r'<div class="entry-content">([\s\S]*?)<!-- \.entry-content -->', page)
    raw = body.group(1) if body else ""
    text = clean(raw)
    refs = []
    for m in BOOK_RE.finditer(text):
        b = norm_book(m.group(1))
        if b and b not in refs: refs.append(b)
    q = text.count("❓")
    theme = re.search(r"Тема\s*:\s*[“\"«]([^”\"»]+)", text)
    # короткий опис: перше речення після «💭» / «📌💭», інакше перше питання
    ex = re.search(r"(?:📌💭|💭)\s*(.{40,300}?[.!?])(?:\s|$)", text)
    excerpt = ex.group(1).strip() if ex else ""
    if not excerpt:
        qq = re.search(r"❓\s*(.{20,220}?\?)", text)
        excerpt = qq.group(1).strip() if qq else ""
    doc = parse_doc(raw)
    return {"url": url, "title": re.sub(r"\s+", " ", title).strip(), "date": (date or "")[:10], "tags": tags, "refs": refs, "q": q, "excerpt": excerpt, "text": text[:6000], "doc": doc}

def main():
    full = "--full" in sys.argv
    OUT.mkdir(exist_ok=True)
    cache = {} if full else (json.loads((OUT / "cache.json").read_text(encoding="utf-8")) if (OUT / "cache.json").exists() else {})
    todo, imgs = list_pages(set(cache), scan_all="--images" in sys.argv or full)
    def one(it):
        u, t = it
        try:
            r = parse_theme(u, t, get(u)); time.sleep(0.15); return r
        except Exception as e:
            print("пропущено:", u, e, file=sys.stderr); return None
    with ThreadPoolExecutor(4) as ex:
        for r in ex.map(one, todo):
            if r: cache[r["url"]] = r
    for u, r in cache.items():
        if u in imgs: r["imgsrc"] = imgs[u]
    download_images(cache)
    fill_docs(cache, force="--docs" in sys.argv or "--reparse" in sys.argv or full, reparse="--reparse" in sys.argv)
    download_body_images(cache)
    (OUT / "cache.json").write_text(json.dumps(cache, ensure_ascii=False) + "\n", encoding="utf-8")
    print("у кеші тем:", len(cache))
    import importlib.util
    spec = importlib.util.spec_from_file_location("hgbuild", ROOT / "hgthemes" / "build.py")
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    mod.build(cache, OUT)

if __name__ == "__main__":
    main()
