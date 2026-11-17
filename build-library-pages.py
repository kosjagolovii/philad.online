#!/usr/bin/env python3
"""Відеобібліотека (/video/ + /video/<slug>/) і архів подій (/events/ + /events/<slug>/).

  python3 update-library.py          # спершу: забрати дані зі старого сайту → library/parsed-*.json
  python3 build-library-pages.py     # потім: бази library/video.js, library/events.js, сторінки списків і кожного запису

Сторінки записів — той самий шаблон A, що й у блозі (build-blog-pages.py, підключається як модуль),
списки — той самий «Журнал» (/category/vse_zapisi/) з тими ж вкладками, чипами й автопідвантаженням (blog/lib.js).
Адреси збігаються зі старими (/video/<slug>/, /events/<slug>/), тож редиректи для них не потрібні.
"""
import json, re, sys, importlib.util, pathlib, urllib.request
sys.path.insert(0, str(pathlib.Path(__file__).parent / "library"))
import classify
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent
LIB = ROOT / "library"
spec = importlib.util.spec_from_file_location("bp", ROOT / "build-blog-pages.py"); bp = importlib.util.module_from_spec(spec); spec.loader.exec_module(bp)
SITE, esc = bp.SITE, bp.esc

VCATS = [("video", "Проповіді"), ("education", "Навчання"), ("interview-vlogs", "Інтерв’ю та відеоблоги"), ("people-blogs", "Історії людей"), ("music", "Музика")]
ALIAS = {"Анатолий Фещенко": "Анатолій Фещенко", "Юрий Кавун": "Юрій Кавун", "Валерий Вернер": "Валерій Вернер"}
ETHEMES = [
 ("war", "Україна і військові", r"ато\b|поранен|військов|капелан|переселен|війн|за україну|молитва за україн|шпитал|шпиталь"),
 ("youth", "Молодь", r"молод|щастя поруч|счастье рядом|студент|підліт|тін|малин фест|malin"),
 ("kids", "Діти", r"діт|дитяч|клуб найкращих|табір|camp|вистав"),
 ("holiday", "Свята й ярмарки", r"різдв|рождеств|великдень|пасх|свято|празд|ярмарок|день народження|річчя|реформац"),
 ("seminar", "Семінари й конференції", r"семінар|конференц|форум|лідерськ|курс|навчан|школа|академі|зустріч лідерів"),
 ("family", "Сім’я", r"сім’|сім'|сем[ьи]|родин|шлюб|батьк"),
 ("worship", "Богослужіння й молитва", r"хрещенн|прославл|молитв|богослуж|вечір хвали|благословен|подяк"),
]
EPERIODS = [("2019", "2019–2022", lambda y: y >= 2019), ("2018", "2018", lambda y: y == 2018), ("2017", "2017", lambda y: y == 2017), ("2016", "2016", lambda y: y == 2016), ("2014", "2014–2015", lambda y: y <= 2015)]

def slugify(s): return re.sub(r"[^\w-]+", "-", s).strip("-")
def lang_of(t): return "ru" if re.search(r"[ыэъё]", t.lower()) and not re.search(r"[іїєґ]", t.lower()) else "uk"
def short(t, n=190):
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) < 45: return ""
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0].rstrip(",;:–- ") + "…"
def plural(n, a, b, c):
    x, y = n % 10, n % 100
    return a if x == 1 and y != 11 else b if 2 <= x <= 4 and not 12 <= y <= 14 else c

def prewarm_thumbs(ids):
    """для кожного відео дізнаємось, який кадр YouTube є найкращим (maxres → sd → hq) — паралельно, один запис кешу"""
    f = bp.BLOG / "yt-thumbs.json"; C = json.loads(f.read_text()) if f.exists() else {}
    def probe(y):
        for n in ("maxresdefault", "sddefault"):
            try:
                r = urllib.request.urlopen(urllib.request.Request(f"https://i.ytimg.com/vi/{y}/{n}.jpg", method="HEAD", headers=bp.UA), timeout=20)
                if r.status == 200: return y, n
            except Exception: pass
        return y, "hqdefault"
    todo = [y for y in ids if y not in C]
    with ThreadPoolExecutor(10) as ex:
        for y, n in ex.map(probe, todo): C[y] = n
    f.write_text(json.dumps(C))

def write_data(name, data, head):
    js = f"/* {head} */\nwindow.PHILAD_BLOG={{\n" + ",\n".join(f"{k}:{json.dumps(v, ensure_ascii=False)}" for k, v in data.items() if k != "posts")
    js += ",\nposts:[\n" + ",\n".join(" " + json.dumps(r, ensure_ascii=False) for r in data["posts"]) + "\n]};\n"
    (LIB / name).write_text(js, "utf-8")

VIDEO_SHELL = """<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Відеобібліотека</title>
<meta name="claude:viewport-fit-sides" content="cover">
<script src="components/site.js"></script>
<link rel="stylesheet" href="sermons/base.css">
<link rel="stylesheet" href="sermons/page.css">
<link rel="stylesheet" href="library/section-video.css">
</head>
<body>
<site-menu tone="auto"></site-menu>
<div class="end">
  <div class="hold"><main class="pg" id="app"><div class="row-w"><p class="kick">Завантаження…</p></div></main></div>
  <site-footer></site-footer>
</div>
<script>window.SM_CONFIG={cfg}</script>
<script src="sermons/base.js"></script>
<script src="sermons/page.js"></script>
</body>
</html>
"""

LIST_SHELL = """<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<script src="components/site.js"></script>
<link rel="stylesheet" href="blog/base.css">
<link rel="stylesheet" href="blog/list.css">
<link rel="stylesheet" href="{css}">
</head>
<body>
<site-menu tone="auto"></site-menu>
<main id="list-app"></main>
<site-footer></site-footer>
<script>window.PHILAD_LIST={cfg}</script>
<script src="{data}"></script>
<script src="blog/lib.js"></script>
<script src="blog/list.js"></script>
</body>
</html>
"""

def video_page():
    """відеобібліотека — ТА САМА сторінка, що й «Проповіді» (sermons/page.js + base.js + base.css), лише з іншими даними"""
    cfg = {"data": "library/video-data.json", "title": "Відеобібліотека", "words": ["відео", "відео", "відео"], "all": "Усі відео", "hideSpeaker": "Невідомий спікер"}
    return VIDEO_SHELL.format(cfg=json.dumps(cfg, ensure_ascii=False))

def events_page(n):
    """архів подій — список у стилі блогу (blog/list.js)"""
    cfg = {"kicker": "Архів подій", "title": f"{n} подій", "sub": "церкви «Філадельфія», 2014–2022", "label": "Архів подій", "search": "Пошук за назвою або текстом…",
           "themesAll": "Усі теми", "words": ["подія", "події", "подій"], "empty": "Нічого не знайшлося — спробуйте інше слово або скиньте фільтри."}
    return LIST_SHELL.format(title="Архів подій", css="library/section-events.css", data="library/events.js", cfg=json.dumps(cfg, ensure_ascii=False))

def main():
    LIB.mkdir(exist_ok=True)
    V = json.loads((LIB / "parsed-video.json").read_text("utf-8")); E = json.loads((LIB / "parsed-events.json").read_text("utf-8"))
    # ---------- відео ----------
    prewarm_thumbs([v["yt"] for v in V])
    tx = json.loads((ROOT / "sermons" / "taxonomy.json").read_text("utf-8"))
    sd = json.loads((ROOT / "sermons" / "data.json").read_text("utf-8"))
    def topics_of(t):
        low = t.lower(); ids = [x["id"] for x in tx["topics"] if any(re.search(r, low) for r in x["match"])]
        if not ids: ids = classify.topics_extra(t)[:2]          # російські назви й додаткові корені: library/classify.py
        return ids or [tx["fallback_topic"]["id"]]
    def dur_of(sec):
        if not sec: return None
        for b in tx["durations"]:
            if b["max"] is None or sec < b["max"]: return b["id"]
    FMT = {"video": "Проповідь", "education": "Навчання", "interview-vlogs": "Інтерв’ю", "people-blogs": "Історії людей", "music": "Музика"}
    KNOWN = sorted({tx["speakers"]["aliases"].get(ALIAS.get(m.group(1).strip(), m.group(1).strip()), ALIAS.get(m.group(1).strip(), m.group(1).strip()))
                    for v in V for m in [re.match(r"^(.{4,42}?)\s*[†~]\s*(.+)$", v["title"])] if m and len(m.group(1).split()) >= 2})
    seen, items, vposts = set(), [], []
    for v in V:                                   # V уже від нових до старих
        if v["yt"] in seen: continue
        seen.add(v["yt"])
        m = re.match(r"^(.{4,42}?)\s*[†~]\s*(.+)$", v["title"])
        speaker = ALIAS.get(m.group(1).strip(), m.group(1).strip()) if m else ""
        speaker = tx["speakers"]["aliases"].get(speaker, speaker)
        title = m.group(2).strip() if m else v["title"]
        if not speaker: speaker = classify.speaker_of(v["title"], v["text"], KNOWN)      # з опису відео / назви «Ім’я – Тема»
        slug = slugify(v["slug"])
        items.append({"id": v["yt"], "title": title, "speaker": speaker or "Невідомий спікер", "format": FMT.get(v["cat"], "Відео"), "date": v["date"], "sec": v["sec"],
                      "dur": dur_of(v["sec"]), "topics": topics_of(title), "page": f"video/{slug}/"})
        vposts.append({"id": slug, "date": v["date"], "title": v["title"], "text": short(v["text"]), "kind": "video", "tabs": [v["cat"]], "themes": [speaker] if speaker else [],
                       "img": f"https://i.ytimg.com/vi/{v['yt']}/hqdefault.jpg", "yt": v["yt"], "page": f"video/{slug}/", "full": v["text"], "lang": lang_of(v["title"] + " " + v["text"][:200]), "speaker": speaker})
    out = {"updated": "2026-11-17", "topics": sd["topics"], "durations": sd["durations"], "avatars": sd["avatars"], "items": items}
    (LIB / "video-data.json").write_text(json.dumps(out, ensure_ascii=False), "utf-8")
    SP = {x["speaker"]: x["speaker"] for x in vposts if x["speaker"]}
    dv = {"KINDS": {"video": "Відео"}, "THEMES": SP, "TABS": [], "posts": [{k: x for k, x in p.items() if k not in ("full", "speaker")} for p in vposts]}
    # ---------- події ----------
    def parse_event(e):
        post = {"id": e["slug"], "title": e["title"], "date": e["date"], "kind": "event", "yt": e["yt"]}
        doc = bp.parse(post, {"html": e["html"], "img": e["cover"]})
        thumb = bp.local_img(e["cover"], "thumb", 960) if e["cover"] else None
        return e, doc, thumb
    bp.CTX.update({"name": "Архів подій", "href": "/events/", "suffix": "Архів подій церкви «Філадельфія»", "imgdir": "library", "css": ["library/section-events.css"]})
    with ThreadPoolExecutor(8) as ex: PE = list(ex.map(parse_event, E))
    eposts, edocs = [], {}
    for e, doc, thumb in PE:
        slug = slugify(e["slug"]); y = int(e["date"][:4]) if e["date"] else 2016
        tab = next(k for k, _, f in EPERIODS if f(y)); low = (e["title"] + " " + re.sub(r"<[^>]+>", " ", e["html"])[:900]).lower()
        th = [k for k, _, rx in ETHEMES if re.search(rx, low)][:2] or []
        text = short(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", e["html"]).replace("&nbsp;", " ")))
        img = (thumb or {}).get("src") or ((doc["hero"] or {}).get("src") or "")
        eposts.append({"id": slug, "date": e["date"], "title": e["title"], "text": text, "kind": "event", "tabs": [tab], "themes": th, "img": img, "page": f"events/{slug}/", "lang": lang_of(e["title"] + " " + text)})
        edocs[slug] = doc
    de = {"TABS": [["all", "Усі події"]] + [[k, l] for k, l, _ in EPERIODS], "KINDS": {"event": "Подія"}, "THEMES": {k: l for k, l, _ in ETHEMES}, "posts": eposts}
    write_data("events.js", de, "Архів подій 2014–2022: єдина база (збирає build-library-pages.py з library/parsed-events.json)")
    # ---------- списки ----------
    (ROOT / "videos.html").write_text(video_page(), "utf-8")
    (ROOT / "events-archive.html").write_text(events_page(len(eposts)), "utf-8")
    # ---------- сторінки записів ----------
    bp.CTX.update({"name": "Відеобібліотека", "href": "/video/", "suffix": "Відеобібліотека церкви «Філадельфія»", "imgdir": "library", "css": ["library/section-video.css"],
               "tag_url": lambda t: "/video/?speaker=" + __import__("urllib.parse").parse.quote(t)})
    Dv = {"KINDS": dv["KINDS"], "THEMES": SP, "TABS": dv["TABS"]}
    for i, p in enumerate(vposts):
        full = p["full"]
        doc = {"author": p["speaker"], "yt": p["yt"], "lede": "", "toc": [], "hero": None,
               "blocks": [{"t": "p", "html": esc(full)}] if full else []}
        pp = {**p, "themes": p["themes"], "min": None}; pp.pop("min")
        rel = bp.pick_related(pp, [x for x in dv["posts"]])
        nav = (dv["posts"][i + 1] if i + 1 < len(vposts) else None, dv["posts"][i - 1] if i else None)
        d = ROOT / p["page"]; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(bp.render(pp, doc, Dv, rel, nav, lambda r: r["page"], f"{SITE}/{p['page']}"), "utf-8")
    bp.CTX.update({"name": "Архів подій", "href": "/events/", "suffix": "Архів подій церкви «Філадельфія»", "imgdir": "library", "css": ["library/section-events.css"], "tag_url": None})
    De = {"KINDS": de["KINDS"], "THEMES": de["THEMES"], "TABS": de["TABS"]}
    for i, p in enumerate(eposts):
        doc = edocs[p["id"]]; doc["lede"] = ""
        rel = bp.pick_related(p, eposts)
        nav = (eposts[i + 1] if i + 1 < len(eposts) else None, eposts[i - 1] if i else None)
        d = ROOT / p["page"]; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(bp.render(p, doc, De, rel, nav, lambda r: r["page"], f"{SITE}/{p['page']}"), "utf-8")
    urls = "".join(f'<url><loc>{SITE}/{p["page"]}</loc><lastmod>{p["date"]}</lastmod></url>\n' for p in vposts + eposts)
    (ROOT / "sitemap-library.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n", "utf-8")
    print(f"відео: {len(vposts)} (спікерів у фільтрі: {len(SP)}), подій: {len(eposts)}; без фото: {sum(1 for p in eposts if not p['img'])}")

if __name__ == "__main__":
    main()
