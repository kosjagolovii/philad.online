#!/usr/bin/env python3
"""Сторінки домашніх груп: groups/data.js → homegroups/<slug> (+ sitemap-homegroups.xml).
Шаблон — як сторінка запису блогу / теми домашньої групи (blog/base.css + blog/post.css), стилі групи — groups/group.css.
slug береться з поля url у groups/data.js (останній сегмент). Група в архіві (archived) сторінки не має.
Запуск:  python3 build-group-pages.py   (потім python3 seo-apply.py)"""
import json, re, html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SITE = "https://philad.org"
esc = lambda s: html.escape(str(s), quote=True)

def load_groups():
    t = (ROOT / "groups" / "data.js").read_text("utf-8")
    t = t[t.index("return [") + 7: t.rindex("];")] + "]"
    t = re.sub(r"//[^\n]*", "", t)
    t = t.replace("at:CH", 'at:[30.51349,50.39785]')
    t = re.sub(r'U\+"([^"]*)"', r'"https://philad.org/groups/\1"', t)
    t = re.sub(r'([{,])\s*([A-Za-z_]\w*)\s*:', r'\1"\2":', t)
    t = "[" + t.strip().rstrip(",").rstrip("]").rstrip() + "]" if not t.lstrip().startswith("[") else t
    t = re.sub(r",\s*([}\]])", r"\1", t)
    return json.loads(t)

def slug_of(g): return g["url"].rstrip("/").rsplit("/", 1)[-1]
def name_of(g): return g.get("title") or g["leader"]
def initials(n): return "".join(w[0] for w in n.split()[:2])

STEPS = [("Спілкування", "Кожна зустріч починається з чаю, смаколиків та щирих розмов про життя."),
         ("Слово Боже", "Ми разом читаємо Біблію й обговорюємо, як застосувати її у щоденному житті."),
         ("Молитва", "Ділимося потребами та молимося один за одного у дружньому колі."),
         ("Служіння", "Розкриваємо свої таланти й дари, щоб служити Богу та іншим людям.")]

def page(g, all_g):
    n, sl = name_of(g), slug_of(g)
    canon = f"{SITE}/groups/{sl}/"
    area = "Онлайн" if g.get("online") else (g["area"] + " район" if not g["area"].startswith(("Бровари", "Теремки", "Ходосіївка")) else g["area"])
    title = f"Домашня група: {n} — {g['area']} | Церква «Філадельфія»"
    desc = f"Домашня група {n}: {g['place']}, {g['when'].lower()}" + (f", {g['ageText']}" if g.get("ageText") else "") + ". Запишіться, і лідер зв’яжеться з вами."
    facts = [("Адреса", g["place"]), ("Коли", g["when"]), ("Вік", g.get("ageText")), ("Район", g["area"]), ("Кількість", g.get("size"))]
    facts = [(k, v) for k, v in facts if v]
    dl = "".join(f"<div><dt>{k}</dt><dd>{esc(v)}</dd></div>" for k, v in facts)
    note = g.get("note") or ("Група зараз збирається онлайн — посилання на зустріч дасть лідер." if g.get("online") else "")
    route = "" if not g.get("at") else f'<a class="lbtn ghost" data-no-u href="https://www.google.com/maps/dir/?api=1&destination={g["at"][1]},{g["at"][0]}" target="_blank" rel="noopener">Маршрут</a>'
    hero = f'<figure class="hero"><img src="groups/{g["img"]}-w.webp" alt="{esc(n)}" width="900" height="612" fetchpriority="high"></figure>' if g.get("img") else ""
    steps = "".join(f"<li><b>{a}</b><span>{b}</span></li>" for a, b in STEPS)
    rel = [x for x in all_g if not x.get("archived") and slug_of(x) != sl and (x["area"] == g["area"] or set(x.get("days", [])) & set(g.get("days", [])))][:4]
    cards = "".join(f'<li><a href="/groups/{slug_of(x)}/">' + (f'<img src="groups/{x["img"]}-a.webp" alt="" width="200" height="200" loading="lazy">' if x.get("img") else f'<i>{esc(initials(name_of(x)))}</i>') +
                    f'<b>{esc(name_of(x))}</b><span>{esc(x["when"])}</span></a></li>' for x in rel)
    more = f'<section class="gmore" aria-labelledby="gm-h"><h2 id="gm-h">Інші домашні групи</h2><ul class="ggrid">{cards}</ul></section>' if cards else ""
    ld = {"@context": "https://schema.org", "@type": "Event", "name": f"Домашня група: {n}", "description": desc, "eventSchedule": {"@type": "Schedule", "repeatFrequency": "P1W", "scheduleTimezone": "Europe/Kyiv"},
          "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode" if g.get("online") else "https://schema.org/OfflineEventAttendanceMode",
          "location": {"@type": "VirtualLocation", "url": canon} if g.get("online") else {"@type": "Place", "name": g["place"], "address": {"@type": "PostalAddress", "addressLocality": "Київ", "streetAddress": g["place"]}},
          "organizer": {"@type": "Organization", "name": "Церква «Філадельфія»", "url": SITE}}
    crumbs = [("Головна", SITE + "/"), ("Домашні групи", SITE + "/domashnie-gruppy/"), (n, canon)]
    bl = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": a, "item": b} for i, (a, b) in enumerate(crumbs)]}
    return f'''<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<base href="/">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="website"><meta property="og:locale" content="uk_UA"><meta property="og:site_name" content="Церква «Філадельфія»">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE}/{('groups/' + g['img'] + '-w.webp') if g.get('img') else 'og.jpg'}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(desc)}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(bl, ensure_ascii=False)}</script>
<meta name="claude:viewport-fit-sides" content="cover">
<script src="components/site.js"></script>
<link rel="stylesheet" href="/contacts/base.css">
<link rel="stylesheet" href="blog/base.css">
<link rel="stylesheet" href="blog/post.css">
<link rel="stylesheet" href="groups/group.css">
</head>
<body>
<site-menu tone="auto"></site-menu>
<div class="end"><div class="hold">
<main class="pg hg-pg"><div class="wrap">
<header class="hd"><nav class="crumbs" aria-label="Хлібні крихти"><ol><li><a href="/">Головна</a></li><li><a href="/domashnie-gruppy/">Домашні групи</a></li><li aria-current="page">{esc(n)}</li></ol></nav>
<h1>{esc(n)}</h1><p class="lede">Домашня група · {esc(area)}</p></header>
<div class="lay"><div class="main">{hero}
<article class="art">
<dl class="gfacts">{dl}</dl>
{f'<p class="gnote">{esc(note)}</p>' if note else ''}
<div class="gacts"><a class="lbtn" href="/groups/{sl}/#join" data-no-u>Записатись у групу</a>{route}<a class="lbtn ghost" href="/domashnie-gruppy/" data-no-u>Усі групи</a></div>
<h2>Як проходить зустріч</h2>
<p>Зустрічі проходять у неформальній та дружній атмосфері, де кожен почувається як вдома. Група невелика, тож тут легко знайти друзів і підтримку.</p>
<ul class="gsteps">{steps}</ul>
<section class="gjoin" id="join" aria-labelledby="gj-h"><h2 id="gj-h">Записатись у групу</h2><p>Залиште контакт — {esc(name_of(g)) if not g.get("title") else "лідер групи"} зв’яжеться з вами й розкаже, як долучитись.</p><div id="formbox"></div></section>
{more}
</article></div></div></div></main>
</div><site-footer></site-footer></div>
<script src="/contacts/base.js"></script>
<script>
document.getElementById("formbox").innerHTML=CT.formHTML({{label:"Записатись у групу",button:"Надіслати",messageLabel:"Коментар",placeholder:"Кілька слів про себе: коли вам зручно, чи були ви в домашніх групах",thanks:"Дякуємо! Заявку отримано",subject:{json.dumps("Заявка в домашню групу: " + n + " (" + g["when"] + ")", ensure_ascii=False)}}});
CT.init({{switcher:false}});
</script>
</body>
</html>
'''

def main():
    G = load_groups(); out = ROOT / "groups"; urls = []
    seen = set()
    for g in G:
        if g.get("archived"): continue
        sl = slug_of(g)
        assert sl not in seen, sl
        seen.add(sl)
        d = out / sl; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(g, G), "utf-8")
        urls.append(f"{SITE}/groups/{sl}/")
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{u}</loc><priority>0.5</priority></url>\n" for u in urls) + "</urlset>\n"
    (ROOT / "sitemap-homegroups.xml").write_text(sm, "utf-8")
    print(f"сторінок груп: {len(urls)}")

if __name__ == "__main__": main()
