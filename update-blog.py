#!/usr/bin/env python3
"""Сторінка «Блог»: забирає всі записи блогу зі старого сайту philad.org і складає з них ОДНУ базу.

  Джерело:   https://philad.org/wp-json/wp/v2/posts  (рубрики: Всі записи, Блог, Статті, Свідоцтва, Новини, Відеоблоги, Відео та інтерв'ю)
  Результат: blog/data.js  (його читають blog.html та всі варіанти через blog/lib.js)
             blog/img/<id>.webp — обкладинки (960 px завширшки)

Що робить для кожного запису:
  • tabs  — у яких вкладках він показується: stati · svid · iv · vlog  (вкладка «Всі записи» = усе);
  • kind  — формат матеріалу: article (стаття) · testimony (свідоцтво) · interview (інтерв'ю) · video (відео)
            · report (репортаж / новина) · statement (позиція церкви);
  • themes — теми за словами в назві й тексті (правила THEMES нижче);
  • yt    — id відео YouTube, якщо воно є в записі; min — хвилин читання для текстів.
Точкові виправлення окремого запису — у blog/overrides.json: {"<id>": {"kind":"interview","themes":["family"],"hide":true}}.
Запуск:  python3 update-blog.py   (повторний запуск картинки не перекачує)
"""
import json, re, html, io, pathlib, urllib.request, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "blog"; IMG = OUT / "img"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}
CATS = {4: "all", 35: "blog", 33: "stati", 64: "svid", 5: "news", 61: "vlog", 366: "iv", 1: "unc"}   # unc = «Uncategorized»: старі відео з каналу YouTube (62)
TESTI = r"свідоцтв|звичайні люди|біблія моєї|я зрозуміла|залежност|шкіра була|бог привів|залишена та знайдена|неповторна|через справи|мене це окриляє|головне – бути з богом|головне – бути з богом"
API = ("https://philad.org/wp-json/wp/v2/posts?categories=" + ",".join(map(str, CATS)) +
       "&per_page=100&page={}&_embed=wp:featuredmedia&_fields=id,date,slug,link,title,excerpt,content,categories,format,_links,_embedded")

# теми: id, назва, слова-маркери (шукаються в назві; якщо там порожньо — у тексті)
THEMES = [
 ("war",     "Війна і служіння",     r"війн|ато\b|волонт|поранен|переселен|незалежн|24 лютого|капелан|sos|вторгнен"),
 ("family",  "Сім’я і виховання",    r"сім|сем[’'ʼ]?[яї]|батьк|вихованн|шлюб|дошлюб|насилл|дітей|сиріт"),
 ("holiday", "Свята",                r"адвент|різдв|великдень|гробк|помин|ярмарок"),
 ("society", "Церква і суспільство", r"суспільств|економік|реформ|гомо|деклараці|позиція|гідність|форум|протестант|захисник"),
 ("history", "Історія церкви",       r"історі[яї] церкви|журнал|xvi|реформац|25 років"),
 ("life",    "Життя церкви",         r"таб[іо]р|camp|хрещенн|відвідав|вечір|молод"),
 ("faith",   "Біблія і віра",        r"бог|біблі|заповіт|союз|молитв|спокус|прощенн|гнів|єрихон|силу|закону|христ|вдячн|вітер|одяг|карантин"),
]
INTERVIEW = r"інтерв|: «|роман шеремета ~|експерта"
STATEMENT = r"позиція церкви|декларація"

def get(url, raw=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
        b = r.read()
    return b if raw else json.loads(b)

def text(s):
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    return re.sub(r"\s+", " ", s).strip()

def tidy(s):
    s = html.unescape(s).replace("“", "«").replace("”", "»").replace("&#8220;", "«").replace("&#8221;", "»")
    return re.sub(r"\s+", " ", s).strip().rstrip(".") if s.count(".") == 1 and s.endswith(".") else re.sub(r"\s+", " ", s).strip()

def excerpt(p, title, body):
    e = text(p["excerpt"]["rendered"]).replace("[…]", "").replace("Читати далі", "").strip()
    e = re.sub(r"^Частина-\d+\s*", "", e)
    e = re.sub(r"[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u00AD]", " ", e); e = re.sub(r"\s+", " ", e).replace(" !", "!").strip()
    e = re.sub(r"https?://\S+|www\.\S+", "", e).strip(" ,·")
    if e.lower().startswith(title.lower()[:30]): e = e[len(title):].strip(" ,.–-")
    if len(e) < 45: return ""          # «церква Філадельфія, Київ» — не підзаголовок
    if len(e) > 190:
        e = e[:190].rsplit(" ", 1)[0].rstrip(",;:–- ") + "…"
    return e

def cover(pid, p, yt):
    """обкладинка: фото запису → кадр YouTube → нічого (картка без фото)"""
    out = IMG / f"{pid}.webp"
    if out.exists(): return f"blog/img/{pid}.webp"
    from PIL import Image
    urls = []
    fm = (p.get("_embedded", {}).get("wp:featuredmedia") or [{}])[0]
    if fm.get("source_url"):
        sizes = fm.get("media_details", {}).get("sizes", {})
        urls += [sizes[k]["source_url"] for k in ("large", "full") if k in sizes] + [fm["source_url"]]
    if yt: urls += [f"https://i.ytimg.com/vi/{yt}/maxresdefault.jpg", f"https://i.ytimg.com/vi/{yt}/hqdefault.jpg"]
    for u in urls:
        try:
            im = Image.open(io.BytesIO(get(u, raw=True))).convert("RGB")
            if im.width < 300: continue
            if im.width > 960: im = im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
            im.save(out, "WEBP", quality=80, method=6)
            return f"blog/img/{pid}.webp"
        except Exception:
            continue
    return ""

def main():
    IMG.mkdir(parents=True, exist_ok=True)
    over = json.loads((OUT / "overrides.json").read_text("utf-8")) if (OUT / "overrides.json").exists() else {}
    raw, page = [], 1
    while True:
        try: part = get(API.format(page))
        except Exception: break
        if not isinstance(part, list) or not part: break
        raw += part; page += 1
        if len(part) < 100: break
    posts = []
    for p in raw:
        if 37 in p["categories"]: continue        # теми домашніх груп живуть окремо (hgthemes)
        pid, cats = p["id"], {CATS[c] for c in p["categories"] if c in CATS}
        title = tidy(p["title"]["rendered"]); c = p["content"]["rendered"]; body = text(c); low = title.lower()
        m = re.search(r"(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=|v/)|youtu\.be/|ytimg\.com/vi/)([\w-]{11})", c)
        yt = m.group(1) if m else ""
        words = len(body.split())
        if "vlog" in cats or p["format"] == "video" or (yt and words < 150): kind = "video"
        elif "svid" in cats: kind = "testimony"
        elif re.search(STATEMENT, low): kind = "statement"
        elif re.search(INTERVIEW, low): kind = "interview"
        elif "news" in cats and "stati" not in cats: kind = "report"
        else: kind = "article"
        if kind == "video" and re.search(INTERVIEW, low): sub = "interview"
        else: sub = ""
        themes = [t for t, _, rx in THEMES if re.search(rx, low)]
        if not themes: themes = [t for t, _, rx in THEMES if len(re.findall(rx, body.lower())) >= 3]
        themes = themes[:2] or ["faith"]
        tabs = []
        if kind in ("article", "statement", "report") or "stati" in cats: tabs.append("stati")
        if kind == "testimony": tabs.append("svid")
        if kind in ("video", "interview") or "iv" in cats: tabs.append("iv")
        if kind == "video": tabs.append("vlog")
        if "unc" in cats and re.search(TESTI, low) and "svid" not in tabs: tabs.append("svid")
        row = {"id": pid, "date": p["date"][:10], "title": title, "text": excerpt(p, title, body), "kind": kind,
               "tabs": tabs, "themes": themes, "href": p["link"],
               "page": urllib.parse.urlparse(p["link"]).path.strip("/").split("/")[0] + "/" + re.sub(r"[^\w-]+", "-", urllib.parse.unquote(p["slug"])).strip("-") + "/"}   # адреса така сама, як на старому philad.org (/uncategorized/…, /blog/…, /vse_zapisi/…)
        if sub: row["sub"] = sub
        if yt: row["yt"] = yt
        if kind != "video": row["min"] = max(1, round(words / 170))
        img = cover(pid, p, yt)
        if img: row["img"] = img
        row.update(over.get(str(pid), {}))
        if not row.get("hide"): posts.append(row)
    posts.sort(key=lambda r: r["date"], reverse=True)
    head = ("/* =====================================================================\n"
            "   Блог церкви · ЄДИНА база записів (статті, свідоцтва, інтерв'ю, відео, репортажі).\n"
            "   Її читають blog.html і всі варіанти через blog/lib.js. Файл збирає update-blog.py зі старого сайту;\n"
            "   правки окремих записів — у blog/overrides.json, новий запис можна дописати рядком нижче.\n"
            "   Поля: id · date · title · text (підзаголовок) · kind (article testimony interview video report statement)\n"
            "         tabs (stati svid iv vlog) · themes · img · yt (id відео YouTube) · min (хв читання) · href (старий сайт) · page (сторінка на новому сайті)\n"
            "   ===================================================================== */\n")
    data = {"TABS": [["all", "Всі записи"], ["stati", "Статті"], ["svid", "Свідоцтва"], ["iv", "Інтерв’ю та відеоблоги"], ["vlog", "Відеоблоги"]],
            "KINDS": {"article": "Стаття", "testimony": "Свідоцтво", "interview": "Інтерв’ю", "video": "Відео", "report": "Репортаж", "statement": "Позиція церкви"},
            "THEMES": {t: n for t, n, _ in THEMES}}
    js = head + "window.PHILAD_BLOG={\n" + ",\n".join(f"{k}:{json.dumps(v, ensure_ascii=False)}" for k, v in data.items())
    js += ",\nposts:[\n" + ",\n".join(" " + json.dumps(r, ensure_ascii=False) for r in posts) + "\n]};\n"
    (OUT / "data.js").write_text(js, "utf-8")
    from collections import Counter
    print(len(posts), "записів;", dict(Counter(r["kind"] for r in posts)), "; без фото:", sum(1 for r in posts if not r.get("img")))

if __name__ == "__main__":
    main()
