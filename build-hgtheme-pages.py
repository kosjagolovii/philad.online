#!/usr/bin/env python3
"""Сторінки тем домашніх груп: генерує статичний HTML для кожної теми (потрібно для SEO — текст, заголовки й
мікророзмітка лежать прямо в HTML, а не підвантажуються скриптом).

  python3 build-hgtheme-pages.py sample              # 3 зразки (варіанти A, B, C) для теми «Від букви до любові»
  python3 build-hgtheme-pages.py all A               # усі теми шаблоном A → homegroups_themes/<slug>/index.html + sitemap-homegroup-themes.xml

Дані беруться з hgthemes/cache.json (текст теми) і hgthemes/data.json (мітки, книги, ілюстрації).
SEO кожної сторінки: один <h1> (назва теми), <h2> на розділи (підсумки, вступ, кроки, висновок, виклик), <h3> усередині;
<title>, meta description, canonical, Open Graph, Twitter Card, JSON-LD Article + BreadcrumbList, хлібні крихти,
посилання на схожі теми. Зразки позначені noindex, щоб не дублювати сторінки в пошуку.
"""
import json, re, sys, html, io, pathlib, urllib.request, urllib.parse, hashlib
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent
SITE = "https://philad.org"
UA = {"User-Agent": "Mozilla/5.0"}
esc = lambda s: html.escape(str(s if s is not None else ""), quote=True)

def slug_of(url):
    return urllib.parse.unquote(url.rstrip("/").split("/")[-1]).replace("\ufeff", "")

def fmt_date(d):
    y, m, dd = map(int, d.split("-"))
    mon = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"][m - 1]
    return f"{dd} {mon} {y}"

def hero_image(theme):
    """Велика версія ілюстрації для шапки теми (1400×790) — завантажується один раз."""
    src = theme.get("imgsrc")
    if not src: return theme.get("img")
    d = ROOT / "hgthemes" / "img" / "hero"; d.mkdir(parents=True, exist_ok=True)
    name = hashlib.sha1(src.encode()).hexdigest()[:12] + ".webp"
    if not (d / name).exists():
        from PIL import Image, ImageOps
        for u in (re.sub(r"-\d+x\d+(\.\w+)$", r"\1", src), src):
            try:
                raw = urllib.request.urlopen(urllib.request.Request(urllib.parse.quote(u, safe=":/?&=%#"), headers=UA), timeout=40).read()
                im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
                im = ImageOps.fit(im, (1400, 790), Image.LANCZOS, centering=(0.5, 0.4))
                im.save(d / name, "WEBP", quality=78, method=5); break
            except Exception:
                continue
        else:
            return theme.get("img")
    return "hgthemes/img/hero/" + name

# ---------- текст теми → HTML ----------
EMO_RUN = re.compile("((?:[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50]\ufe0f?\u200d?)+\\s*)")
def em(run): return f'<span class="em" aria-hidden="true">{esc(run)}</span>'
SLUGS = set()
CUR = {"legacy": False}   # жирний/курсив з оригіналу показуємо лише в темах, що були на старому сайті на момент міграції
SELF_LINK = re.compile(r'href="https?://(?:www\.)?philad\.org/homegroups_themes/([^"/]+)/?"')
def inline(h):
    if not CUR["legacy"]: h = re.sub(r"</?[bi]>", "", h)
    h = h.replace("<b>", "<strong>").replace("</b>", "</strong>").replace("<i>", "<em>").replace("</i>", "</em>")
    h = SELF_LINK.sub(lambda m: f'href="homegroups_themes/{m.group(1)}/"' if m.group(1) in SLUGS else f'href="https://philad.org/homegroups_themes/{m.group(1)}/" target="_blank" rel="noopener"', h)
    h = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener nofollow"', h)
    return h

def rich(b, key="text"):
    """Текст блоку; смайлики з оригіналу загорнуті в span.em (показуються перемикачем «З емоджі»)."""
    if b.get("etext"):
        return "".join(em(x) if i % 2 else esc(x) for i, x in enumerate(EMO_RUN.split(b["etext"])))
    lead = em(b["emo"] + " ") if b.get("emo") else ""
    return lead + (inline(b["html"]) if b.get("html") else esc(b[key]))

def blocks_html(blocks):
    out, qs, bl = [], [], []
    def flush():
        nonlocal qs, bl
        if qs: out.append('<ol class="qs">' + "".join(qs) + "</ol>"); qs = []
        if bl: out.append('<ul class="bul">' + "".join(bl) + "</ul>"); bl = []
    for b in blocks:
        t = b["t"]
        if t != "bul" and bl: flush()
        if t == "bul":
            if qs: flush()
            bl.append(f'<li>{rich(b)}</li>')
        elif t == "q": qs.append(f'<li>{rich(b)}</li>')
        elif t == "hint":
            if qs: qs[-1] = qs[-1][:-5] + f'<span class="hint">{rich(b)}</span></li>'
            else: out.append(f'<p class="hint">{rich(b)}</p>')
        elif t == "li": qs.append(f'<li>{rich(b)}</li>')
        elif t == "v":
            flush()
            lead = em(b["emo"] + " ") if b.get("emo") else ""
            cite = f'<cite>{lead}{esc(b["ref"])}</cite>' if b.get("ref") else ""
            out.append(f'<blockquote class="verse"><p>{"" if b.get("ref") else lead}{esc(b["text"])}</p>{cite}</blockquote>')
        elif t == "h":
            flush(); out.append(f'<h3>{rich(b)}</h3>')
        elif t == "video":
            flush(); out.append(f'<figure class="vid"><iframe src="https://www.youtube-nocookie.com/embed/{esc(b["id"])}" title="Відео до теми" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></figure>')
        elif t == "img":
            if b.get("local"):
                flush(); out.append(f'<figure class="pic"><img src="{esc(b["local"])}" alt="{esc(b.get("alt",""))}" loading="lazy"></figure>')
        else:
            flush(); out.append(f'<p{" class=idea" if b.get("idea") else ""}>{rich(b)}</p>')
    flush()
    return "".join(out)

NUM = re.compile(r"^\d+\.?\s*")

def conclusion_html(blocks):
    items = []
    for b in blocks:
        txt = b["text"]
        m = re.match(r"^\d+\.?\s*([^:]{2,70}):\s*(.*)$", txt, re.S)
        if m: items.append("<li><strong>" + esc(m.group(1)) + ".</strong> " + esc(m.group(2)) + "</li>")
        else: items.append("<li>" + esc(NUM.sub("", txt)) + "</li>")
    return '<ol class="concl">' + "".join(items) + "</ol>"

def fold_html(blocks):
    """Підсумок минулої теми: «Висновки» і «Виклик» — згортні блоки."""
    pre, groups = [], []
    for b in blocks:
        if b["t"] == "h": groups.append([b, []])
        elif groups: groups[-1][1].append(b)
        else: pre.append(b)
    out = blocks_html(pre)
    for title, bl in groups:
        out += f'<details class="fold"><summary><span>{rich(title)}</span></summary><div class="fold-b">{blocks_html(bl)}</div></details>'
    return out

def sections_of(doc):
    S = []
    if doc.get("recap"):
        title = "Підсумки минулої теми" + (f": «{doc['prev_title']}»" if doc.get("prev_title") else "")
        S.append({"id": "pidsumky", "title": title, "kind": "recap", "emo": (doc.get("emo") or {}).get("recap", ""), "html": blocks_html(doc["recap"]), "html_fold": fold_html(doc["recap"])})
    pts = doc.get("points") or []
    if doc.get("intro"):
        S.append({"id": "vstup" if pts else "material", "title": "Вступ до теми" if pts else "Матеріал для обговорення", "kind": "intro", "html": blocks_html(doc["intro"])})
    for i, p in enumerate(pts, 1):
        S.append({"id": f"krok-{i}", "title": re.sub(r"^\d+[\.\)]\s*", "", p["title"]), "kind": "step", "num": i, "html": blocks_html(p["blocks"])})
    if doc.get("conclusion"):
        S.append({"id": "vysnovok", "title": "Висновок", "kind": "conclusion", "emo": (doc.get("emo") or {}).get("conclusion", ""), "html": conclusion_html(doc["conclusion"])})
    if doc.get("challenge"):
        S.append({"id": "vyklyk", "title": "Виклик на тиждень", "kind": "challenge", "emo": (doc.get("emo") or {}).get("challenge", ""), "html": blocks_html(doc["challenge"])})
    return S

# ---------- спільні шматки сторінки ----------
def lang_of(t):
    """Мова теми (uk/ru) визначається в hgthemes/build.py; частина тем на старому сайті російською."""
    return t.get("lang", "uk")

def head(t, path, sample, extra_css, links=""):
    title = f"{t['title']} — тема домашньої групи | Церква «Філадельфія»"
    desc = (t.get("excerpt") or t.get("text", "")[:200]).strip()
    desc = re.sub(r"\s*[•●⁃]\s*", " ", re.sub(r"\s+", " ", desc)).strip()[:155].rsplit(" ", 1)[0] + ("…" if len(desc) > 155 else "")
    canon = f"{SITE}/homegroups_themes/{t['slug']}/"
    img = f"{SITE}/{t['hero']}" if t.get("hero") else ""
    tags = [t["tagLabels"][x] for x in t["tags"] if x in t["tagLabels"]]
    crumbs = [("Головна", f"{SITE}/"), ("Домашні групи", f"{SITE}/homegroups.html"), ("Теми домашніх груп", f"{SITE}/homegroup-themes.html"), (t["title"], canon)]
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": t["title"], "description": desc, "image": [img] if img else [],
           "datePublished": t["date"], "dateModified": t["date"], "inLanguage": "uk", "articleSection": "Теми домашніх груп", "keywords": ", ".join(tags),
           "mainEntityOfPage": {"@type": "WebPage", "@id": canon},
           "author": {"@type": "Organization", "name": "Церква «Філадельфія»", "url": SITE},
           "publisher": {"@type": "Organization", "name": "Церква «Філадельфія»", "url": SITE, "logo": {"@type": "ImageObject", "url": f"{SITE}/logo-mark.png"}}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList",
           "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]}]
    og = [("og:type", "article"), ("og:locale", "uk_UA"), ("og:site_name", "Церква «Філадельфія»"), ("og:title", t["title"]), ("og:description", desc), ("og:url", canon)]
    if img: og.append(("og:image", img))
    og += [("article:published_time", t["date"]), ("article:section", "Теми домашніх груп")] + [("article:tag", x) for x in tags]
    tw = [("twitter:card", "summary_large_image"), ("twitter:title", t["title"]), ("twitter:description", desc)] + ([("twitter:image", img)] if img else [])
    return f'''<!doctype html>
<html lang="{lang_of(t)}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<base href="/">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="{'noindex,follow' if sample else 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="{esc(canon)}">
{''.join(f'<meta property="{k}" content="{esc(v)}">' + chr(10) for k, v in og)}{''.join(f'<meta name="{k}" content="{esc(v)}">' + chr(10) for k, v in tw)}<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<meta name="claude:viewport-fit-sides" content="cover">
<script src="components/site.js"></script>
{links}<style>
{BASE_CSS}
{extra_css}
</style>
</head>
'''

def crumbs_html(t):
    return f'''<nav class="crumbs" aria-label="Хлібні крихти"><ol>
<li><a href="/">Головна</a></li><li><a href="/domashnie-gruppy/">Домашні групи</a></li><li><a href="/zavhdi_molytysya_i_ne_zanepadaty_duhom/">Теми домашніх груп</a></li><li aria-current="page">{esc(t["title"])}</li></ol></nav>'''

def meta_html(t):
    tags = "".join(f'<a href="/zavhdi_molytysya_i_ne_zanepadaty_duhom/?tag={esc(x)}">{esc(t["tagLabels"][x])}</a>' for x in t["tags"] if x in t["tagLabels"])
    books = "".join(f'<a href="/zavhdi_molytysya_i_ne_zanepadaty_duhom/?book={esc(b)}">{esc(b)}</a>' for b in t["refs"][:8])
    return f'<p class="meta"><time datetime="{esc(t["date"])}">{fmt_date(t["date"])}</time></p>', tags, books

def related_html(t, rel, heading_cls="rel"):
    cards = "".join(f'''<article class="rc"><a class="rc-img" href="{esc(r["url"])}" tabindex="-1" aria-hidden="true"><img src="{esc(r["img"])}" alt="" loading="lazy"></a>
<time datetime="{esc(r["date"])}">{fmt_date(r["date"])}</time><h3><a href="{esc(r["url"])}">{esc(r["title"])}</a></h3></article>''' for r in rel)
    return f'<section class="{heading_cls}" aria-labelledby="rel-h"><h2 id="rel-h">Схожі теми</h2><div class="rc-grid">{cards}</div></section>' if rel else ""

def footer_tail(inner, script=""):
    return f'''<body>
<site-menu tone="auto"></site-menu>
<div class="end">
  <div class="hold">
{inner}
  </div>
  <site-footer></site-footer>
</div>
<script>document.getElementById("footer")&&document.getElementById("footer").setAttribute("data-dark","");{script}</script>
</body>
</html>
'''

# ---------- загальний CSS ----------
BASE_CSS = '''
:root{--ds-cream:#F7F2E8;--ink:#141414;--teal:#317C8E;--teal-ink:#28697A;--sand:#E6E1D4;--card:#E8E7DB;--mute:#85837E;--line:rgba(20,20,20,.14);--soft:rgba(20,20,20,.7);
  --sans:"Manrope",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--side:12px;color-scheme:light}
html,body{margin:0;padding:0;background:var(--ds-cream);color:var(--ink)}
body{font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:clip}
img{max-width:100%;display:block}
h1,h2,h3,p,ol,ul,blockquote,figure{margin:0}
ol,ul{padding:0;list-style:none}
a{color:inherit}
.end{position:relative;z-index:3}
.hold{position:relative;z-index:1;background:var(--ds-cream)}
.crumbs ol{display:flex;flex-wrap:wrap;gap:4px 10px;font-weight:600;font-size:13px;letter-spacing:-.01em;color:var(--mute)}
.crumbs li+li::before{content:"/";margin-right:10px;opacity:.6}
.crumbs a{text-decoration:none}.crumbs a:hover{color:var(--teal-ink)}
.crumbs [aria-current]{color:var(--ink)}
.tags,.books{display:flex;flex-wrap:wrap;gap:6px}
.tags a,.books a{display:inline-flex;align-items:center;min-height:32px;padding:0 13px;border-radius:999px;background:rgba(20,20,20,.07);text-decoration:none;font-weight:600;font-size:13px;letter-spacing:-.01em;color:var(--soft);transition:background .2s ease,color .2s ease}
.tags a:hover,.books a:hover{background:var(--teal);color:var(--ds-cream)}
.books a{background:transparent;box-shadow:inset 0 0 0 1px var(--line)}
.meta{font-weight:600;font-size:14px;color:var(--mute)}
/* питання, вірші, абзаци */
.lbl{font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.qs{display:grid;gap:12px;margin:6px 0}
.qs li{position:relative;padding-left:40px;font-weight:600;font-size:clamp(18px,1.5vw,21px);line-height:1.4;letter-spacing:-.02em}
.qs li::before,.qs .hint::before,.hint::before,.verse cite::before,.sec p.idea::before,.sec.recap h2::before,.sec.challenge h2::before,.sec.conclusion h2::before{content:"";background:currentColor}
.qs li::before{position:absolute;left:0;top:-1px;width:28px;height:28px;color:var(--teal);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8'/%3E%3Cpath d='M12 17h.01'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8'/%3E%3Cpath d='M12 17h.01'/%3E%3C/svg%3E") center/contain no-repeat}
.qs .hint{display:block;margin-top:6px;font-weight:600;font-size:15px;color:var(--teal-ink)}
.qs .hint::before,.hint::before{display:inline-block;vertical-align:-4px;margin-right:8px;width:20px;height:20px;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18.5h6M10 21h4'/%3E%3Cpath d='M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2.2h5c0-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18.5h6M10 21h4'/%3E%3Cpath d='M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2.2h5c0-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3z'/%3E%3C/svg%3E") center/contain no-repeat}
.hint{font-weight:600;font-size:16px;color:var(--teal-ink)}
.verse{position:relative;padding:20px 24px 20px 28px;border-radius:16px;background:rgba(49,124,142,.1);margin:6px 0}
.verse::before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:4px;border-radius:4px;background:var(--teal)}
.verse p{font-weight:500;font-size:clamp(18px,1.6vw,22px);line-height:1.45;letter-spacing:-.02em}
.verse cite::before{display:inline-block;vertical-align:-4px;margin-right:8px;width:20px;height:20px;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 5.5c0-.8.7-1.5 1.5-1.5h6v15H5c-.8 0-1.5-.7-1.5-1.5z'/%3E%3Cpath d='M20.5 5.5c0-.8-.7-1.5-1.5-1.5h-6v15h6c.8 0 1.5-.7 1.5-1.5z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 5.5c0-.8.7-1.5 1.5-1.5h6v15H5c-.8 0-1.5-.7-1.5-1.5z'/%3E%3Cpath d='M20.5 5.5c0-.8-.7-1.5-1.5-1.5h-6v15h6c.8 0 1.5-.7 1.5-1.5z'/%3E%3C/svg%3E") center/contain no-repeat}
.verse cite{display:block;margin-top:10px;font-style:normal;font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--teal-ink)}
.sec p{font-weight:500;font-size:clamp(17px,1.4vw,19px);line-height:1.55;letter-spacing:-.015em;color:var(--soft)}
.sec p.idea{position:relative;padding-left:40px;color:var(--ink);font-size:clamp(18px,1.5vw,21px)}
.sec p.idea::before{position:absolute;left:0;top:2px;width:26px;height:26px;color:var(--teal);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 5.5h16v10.5H9.5L5 20v-4H4z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 5.5h16v10.5H9.5L5 20v-4H4z'/%3E%3C/svg%3E") center/contain no-repeat}
.sec h3{font-weight:700;font-size:clamp(19px,1.6vw,23px);letter-spacing:-.03em;margin-top:8px}
.concl{display:grid;gap:12px;counter-reset:c}
.concl li{position:relative;padding:20px 22px 20px 64px;border-radius:16px;background:var(--card);font-weight:500;font-size:17px;line-height:1.5;letter-spacing:-.015em;color:var(--soft);counter-increment:c}
.concl li::before{content:counter(c);position:absolute;left:20px;top:18px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:var(--ds-cream);font-weight:800;font-size:13px}
.concl strong{color:var(--ink);font-weight:700}
.sec{display:grid;gap:18px;align-content:start;scroll-margin-top:100px}
.sec.recap h2::before,.sec.challenge h2::before,.sec.conclusion h2::before{display:block;width:44px;height:44px;margin-bottom:14px;color:var(--teal)}
.sec.recap h2::before{-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 14 4 9l5-5'/%3E%3Cpath d='M4 9h10a6 6 0 0 1 0 12h-3'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 14 4 9l5-5'/%3E%3Cpath d='M4 9h10a6 6 0 0 1 0 12h-3'/%3E%3C/svg%3E") center/contain no-repeat}
.sec.challenge h2::before{-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 21V4'/%3E%3Cpath d='M5 4h12l-2.5 4L17 12H5'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 21V4'/%3E%3Cpath d='M5 4h12l-2.5 4L17 12H5'/%3E%3C/svg%3E") center/contain no-repeat}
.sec.conclusion h2::before{-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='m8 12.5 2.7 2.7L16 9.5'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='m8 12.5 2.7 2.7L16 9.5'/%3E%3C/svg%3E") center/contain no-repeat}
.sec h2{font-weight:500;font-size:clamp(28px,3vw,44px);line-height:1.08;letter-spacing:-.045em;text-wrap:balance}
/* схожі теми */
.rel{display:grid;gap:22px}
.rel h2{font-weight:500;font-size:clamp(26px,2.8vw,40px);letter-spacing:-.045em}
.rc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px 14px}
.rc{display:grid;gap:10px;align-content:start}
.rc-img{display:block;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:var(--sand)}
.rc-img img{width:100%;height:100%;object-fit:cover;transition:scale .9s cubic-bezier(.2,.7,.2,1)}
.rc:hover .rc-img img{scale:1.05}
.rc time{font-weight:600;font-size:13px;color:var(--mute)}
.rc h3{font-weight:500;font-size:clamp(19px,1.6vw,23px);line-height:1.15;letter-spacing:-.035em}
.rc h3 a{text-decoration:none}.rc h3 a:hover{color:var(--teal-ink)}
.back{display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 24px;border-radius:12px;background:var(--teal);color:var(--ds-cream);text-decoration:none;font:800 12px/1 var(--sans);letter-spacing:.04em;text-transform:uppercase;transition:scale .35s cubic-bezier(.2,.7,.2,1),background .25s ease}
.back:hover{scale:1.04;background:var(--teal-ink)}
@media (max-width:900px){.rc-grid{grid-template-columns:minmax(0,1fr)}}
@media (max-width:720px){:root{--side:16px}.verse{padding:16px 18px 16px 22px}.qs li{padding-left:40px}.concl li{padding:16px 16px 16px 56px}.concl li::before{left:16px;top:15px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
'''

# ---------- ВАРІАНТ A · «Стаття» ----------
CSS_A = '''
/* A · «Стаття»: читабельна колонка, зліва закріплений зміст */
.pg{padding:130px max(var(--side),env(safe-area-inset-left,0px)) 90px;display:grid;justify-items:center;gap:80px}
.wrap{width:var(--row);max-width:100%;min-width:0}
.hd{display:grid;justify-items:center;text-align:center;gap:22px;max-width:980px;margin:0 auto 44px}
.hd h1{font-weight:500;font-size:clamp(40px,5.6vw,88px);line-height:.98;letter-spacing:-.055em;text-wrap:balance}
.hd .crumbs ol{justify-content:center}
.lede{font-weight:600;font-size:clamp(18px,1.6vw,22px);line-height:1.4;letter-spacing:-.025em;color:var(--mute);max-width:760px;margin-inline:auto;text-wrap:balance}
.hero{aspect-ratio:21/9;border-radius:24px;overflow:hidden;background:var(--sand);margin-bottom:56px}
.hero img{width:100%;height:100%;object-fit:cover}
.lay{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:14px;align-items:start}
.toc{grid-column:1/2;position:sticky;top:104px;display:grid;gap:18px;padding-right:20px}
.lbl{font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.toc a{display:block;padding:7px 0 7px 14px;border-left:2px solid var(--line);text-decoration:none;font-weight:600;font-size:15px;line-height:1.3;letter-spacing:-.02em;color:var(--mute);transition:color .2s ease,border-color .2s ease}
.toc a:hover,.toc a.on{color:var(--ink);border-color:var(--teal)}
.art{grid-column:2/4;display:grid;gap:64px;min-width:0}
.aside{grid-column:4/5;display:grid;gap:26px;align-content:start;position:sticky;top:104px;padding-left:20px}
.aside .lbl{margin-bottom:10px}
.pic{margin:22px 0;display:flex;justify-content:flex-start}
.pic img{display:block;width:auto;height:auto;max-width:100%;max-height:50vh;border-radius:18px;background:var(--sand)}
.aside .meta{font-weight:600;font-size:14px;color:var(--mute)}
.sec .num{font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--teal)}
/* відгук про тему */
.fb{display:flex;justify-content:flex-start;padding-top:8px}
.ghost{display:inline-flex;align-items:center;height:48px;padding:0 24px;border:1.5px solid var(--line);border-radius:12px;background:transparent;color:var(--ink);cursor:pointer;font:800 12px/1 var(--sans);letter-spacing:.04em;text-transform:uppercase;transition:border-color .25s ease,background .25s ease}
.ghost:hover{border-color:var(--ink);background:rgba(20,20,20,.04)}
.ghost:focus-visible{outline:2px solid var(--teal);outline-offset:3px}
.fbm{width:min(560px,calc(100vw - 32px));padding:0;border:0;border-radius:24px;background:var(--ds-cream);color:var(--ink);box-shadow:0 30px 90px -20px rgba(20,17,15,.5)}
.fbm::backdrop{background:rgba(20,17,15,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.fbm form{display:grid;gap:16px;padding:32px}
.fbm .fh{font-weight:500;font-size:clamp(26px,3vw,34px);line-height:1.1;letter-spacing:-.045em;padding-right:36px}
.fbm .sub{font-weight:600;font-size:15px;line-height:1.4;color:var(--mute)}
.fbm label{display:grid;gap:8px;font-weight:600;font-size:14px;letter-spacing:-.01em;color:var(--mute)}
.fbm input,.fbm textarea{box-sizing:border-box;width:100%;padding:15px 18px;border:1px solid var(--line);border-radius:14px;background:#fff;font:500 17px/1.35 var(--sans);letter-spacing:-.02em;color:var(--ink)}
.fbm textarea{min-height:130px;resize:vertical}
.fbm input:focus,.fbm textarea:focus{outline:none;border-color:var(--teal)}
.fbm [aria-invalid="true"]{border-color:#C0392B}
.fbm .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.fbm .send{height:52px;padding:0 28px;border:0;border-radius:12px;background:var(--teal);color:var(--ds-cream);cursor:pointer;font:800 12px/1 var(--sans);letter-spacing:.04em;text-transform:uppercase}
.fbm .send:hover{background:var(--teal-ink)}
.fbm .send[disabled]{opacity:.6;cursor:wait}
.fbm .st{margin:0;font-weight:700;font-size:14px;color:var(--teal-ink)}
.fbm .st.err{color:#C0392B}
.fbm .x{position:absolute;top:14px;right:14px;display:grid;place-items:center;width:38px;height:38px;border:0;border-radius:50%;background:rgba(20,20,20,.07);cursor:pointer;font-size:22px;line-height:1;color:var(--ink)}
.fbm .x:hover{background:var(--ink);color:var(--ds-cream)}
.fbm .done{display:none;gap:10px;padding:40px 32px}
.fbm.sent form{display:none}.fbm.sent .done{display:grid}
.fbm .hp{position:absolute;left:-9999px}
@media (max-width:1100px){
  .lay{grid-template-columns:minmax(0,1fr)}.toc,.art,.aside{grid-column:1/-1;position:static;padding:0}.toc{display:none}.art{margin-bottom:40px}
  .aside{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:720px){.pg{padding-top:112px;gap:56px}.hero{aspect-ratio:16/10;border-radius:16px;margin-bottom:36px}.aside{grid-template-columns:minmax(0,1fr)}.art{gap:48px}}
'''

def page_a(t, secs, rel, sample, path):
    date, tags, books = meta_html(t)
    toc = "".join(f'<a href="{path}#{s["id"]}">{esc(s["title"])}</a>' for s in secs)
    body = []
    for s in secs:
        inner = s["html"]
        num = f'<span class="num">Крок {s["num"]}</span>' if s["kind"] == "step" else ""
        body.append(f'<section class="sec {s["kind"]}" id="{s["id"]}" aria-labelledby="{s["id"]}-h">{num}<h2 id="{s["id"]}-h">{esc(s["title"])}</h2>{inner}</section>')
    hero = f'<figure class="hero"><img src="{esc(t["hero"])}" alt="{esc(t["title"])}" width="1400" height="790" fetchpriority="high"></figure>' if t.get("hero") else ""
    lede = f'<p class="lede">{esc(t["excerpt"])}</p>' if t.get("excerpt") else ""
    inner = f'''<main class="pg"><div class="wrap">
<header class="hd">{crumbs_html(t)}<h1>{esc(t["title"])}</h1>{lede}</header>
{hero}
<div class="lay">
<nav class="toc" aria-label="Зміст теми"><p class="lbl">Зміст</p>{toc}</nav>
<article class="art">{"".join(body)}
<div class="fb"><button class="ghost" type="button" id="fb-open" aria-haspopup="dialog">Залишити відгук про тему</button></div></article>
<aside class="aside" aria-label="Про тему">
<div><p class="lbl">Дата</p>{date}</div>
</aside></div></div>
<div class="wrap">{related_html(t, rel)}</div></main>
<dialog class="fbm" id="fb-m" aria-labelledby="fb-h">
<button class="x" type="button" id="fb-x" aria-label="Закрити">×</button>
<form id="fb-f" novalidate><p class="fh" id="fb-h">Відгук про тему</p><p class="sub">«{esc(t["title"])}»</p>
<label>Ім’я<input name="name" type="text" autocomplete="given-name" required></label>
<label>Що можна покращити в цій темі?<textarea name="text" required></textarea></label>
<label class="hp" aria-hidden="true">Не заповнюйте<input name="website" tabindex="-1" autocomplete="off"></label>
<div class="row"><button class="send" type="submit">Надіслати</button><p class="st" role="status" aria-live="polite"></p></div></form>
<div class="done"><p class="fh">Дякуємо за відгук!</p><p class="sub">Він допоможе зробити тему кращою.</p><div><button class="ghost" type="button" id="fb-c">Закрити</button></div></div>
</dialog>'''
    js = '''const L=[...document.querySelectorAll(".toc a")],S=L.map(a=>document.getElementById(a.hash.slice(1)));
const spy=()=>{const y=innerHeight*.3;let c=0;S.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<=y)c=i});L.forEach((a,i)=>a.classList.toggle("on",i===c))};
addEventListener("scroll",spy,{passive:true});spy();
/* відгук про тему */
const dlg=document.getElementById("fb-m"),fm=document.getElementById("fb-f"),st=fm.querySelector(".st");
document.getElementById("fb-open").addEventListener("click",()=>{dlg.classList.remove("sent");st.textContent="";dlg.showModal()});
document.getElementById("fb-x").addEventListener("click",()=>dlg.close());document.getElementById("fb-c").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
fm.addEventListener("submit",async e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(fm));if(d.website)return;
  const bad=["name","text"].filter(k=>String(d[k]||"").trim().length<2);
  ["name","text"].forEach(k=>fm.elements[k].setAttribute("aria-invalid",bad.includes(k)));
  if(bad.length){st.textContent="Заповніть обидва поля.";st.className="st err";fm.elements[bad[0]].focus();return}
  const S=window.SITE_DATA||{},p={type:"theme-feedback",theme:document.querySelector("h1").textContent,url:location.href,name:d.name.trim(),text:d.text.trim()};
  const btn=fm.querySelector(".send");btn.disabled=true;st.className="st";st.textContent="Надсилаємо…";
  if(S.formEndpoint){try{const r=await fetch(S.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!r.ok)throw 0;dlg.classList.add("sent");fm.reset()}catch(_){st.className="st err";st.textContent="Не вдалося надіслати. Спробуйте ще раз."}}
  else{location.href="mailto:"+(S.email||"info@philad.org")+"?subject="+encodeURIComponent("Відгук про тему «"+p.theme+"»")+"&body="+encodeURIComponent("Ім’я: "+p.name+"\\n\\n"+p.text+"\\n\\n"+p.url);st.textContent="Відкрили вашу поштову програму — натисніть «Надіслати» у листі."}
  btn.disabled=false});'''
    return head(t, path, sample, CSS_A) + footer_tail(inner, js)

# ---------- ВАРІАНТИ B і C · «Medium» (чисте читання, без іконок і плашок) ----------
FB_CSS = CSS_A[CSS_A.index("/* відгук про тему */"):CSS_A.index("@media (max-width:1100px)")]
FB_JS = """const dlg=document.getElementById("fb-m"),fm=document.getElementById("fb-f"),st=fm.querySelector(".st");
document.getElementById("fb-open").addEventListener("click",()=>{dlg.classList.remove("sent");st.textContent="";dlg.showModal()});
document.getElementById("fb-x").addEventListener("click",()=>dlg.close());document.getElementById("fb-c").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
fm.addEventListener("submit",async e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(fm));if(d.website)return;
  const bad=["name","text"].filter(k=>String(d[k]||"").trim().length<2);
  ["name","text"].forEach(k=>fm.elements[k].setAttribute("aria-invalid",bad.includes(k)));
  if(bad.length){st.textContent="Заповніть обидва поля.";st.className="st err";fm.elements[bad[0]].focus();return}
  const S=window.SITE_DATA||{},p={type:"theme-feedback",theme:document.querySelector("h1").textContent,url:location.href,name:d.name.trim(),text:d.text.trim()};
  const btn=fm.querySelector(".send");btn.disabled=true;st.className="st";st.textContent="Надсилаємо…";
  if(S.formEndpoint){try{const r=await fetch(S.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!r.ok)throw 0;dlg.classList.add("sent");fm.reset()}catch(_){st.className="st err";st.textContent="Не вдалося надіслати. Спробуйте ще раз."}}
  else{location.href="mailto:"+(S.email||"info@philad.org")+"?subject="+encodeURIComponent("Відгук про тему «"+p.theme+"»")+"&body="+encodeURIComponent("Ім’я: "+p.name+"\\n\\n"+p.text+"\\n\\n"+p.url);st.textContent="Відкрили вашу поштову програму — натисніть «Надіслати» у листі."}
  btn.disabled=false});"""

def fb_modal(t):
    return f"""<dialog class="fbm" id="fb-m" aria-labelledby="fb-h">
<button class="x" type="button" id="fb-x" aria-label="Закрити">×</button>
<form id="fb-f" novalidate><p class="fh" id="fb-h">Відгук про тему</p><p class="sub">«{esc(t["title"])}»</p>
<label>Ім’я<input name="name" type="text" autocomplete="given-name" required></label>
<label>Що можна покращити в цій темі?<textarea name="text" required></textarea></label>
<label class="hp" aria-hidden="true">Не заповнюйте<input name="website" tabindex="-1" autocomplete="off"></label>
<div class="row"><button class="send" type="submit">Надіслати</button><p class="st" role="status" aria-live="polite"></p></div></form>
<div class="done"><p class="fh">Дякуємо за відгук!</p><p class="sub">Він допоможе зробити тему кращою.</p><div><button class="ghost" type="button" id="fb-c">Закрити</button></div></div>
</dialog>"""

SERIF_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">\n'

MED_COMMON = """
/* без іконок і кольорових плашок */
.qs li::before,.qs .hint::before,.hint::before,.verse cite::before,.verse::before,.sec p.idea::before,.sec.recap h2::before,.sec.challenge h2::before,.sec.conclusion h2::before{content:none!important;display:none!important}
.pg{padding:130px max(var(--side),env(safe-area-inset-left,0px)) 90px;display:grid;justify-items:center;gap:80px}
.wrap{width:var(--row);max-width:100%;min-width:0}
.hd{display:grid;justify-items:center;text-align:center;gap:20px;max-width:860px;margin:0 auto 56px}
.hd .crumbs ol{justify-content:center}
.hd h1{font-weight:500;font-size:clamp(38px,5.2vw,72px);line-height:1.02;letter-spacing:-.05em;text-wrap:balance}
.lede{font-weight:600;font-size:clamp(18px,1.6vw,22px);line-height:1.45;letter-spacing:-.02em;color:var(--mute);max-width:640px;margin-inline:auto;text-wrap:balance}
.hero{margin:0 auto 64px;border-radius:6px;overflow:hidden;background:var(--sand)}
.hero img{display:block;width:100%;height:100%;object-fit:cover}
.art{margin-inline:auto;display:grid;gap:56px;min-width:0}
.sec{display:grid;gap:0;align-content:start}
.sec h2{font-weight:600;font-size:clamp(26px,2.4vw,32px);line-height:1.2;letter-spacing:-.035em;margin:0 0 14px;text-wrap:balance}
.sec h3{font-weight:600;font-size:clamp(20px,1.8vw,23px);line-height:1.3;letter-spacing:-.025em;margin:32px 0 8px}
.sec p,.sec p.idea{margin:0 0 1.35em;padding:0;color:#242424}
.sec>:last-child{margin-bottom:0}
.qs{list-style:none;margin:.5em 0 .35em;padding:0;display:grid;gap:1.1em}
.qs+.verse,.qs+blockquote{margin-top:.7em}
.qs li{padding:0;color:var(--ink)}
.qs .hint,.sec p.hint{display:block;margin-top:.35em;font-style:italic;font-weight:500;font-size:.86em;line-height:1.5;color:var(--mute)}
.verse{margin:1.2em 0 1.6em;padding:0;border:0;border-radius:0;background:none}
.verse p{margin:0;color:var(--ink);font-family:var(--serif)}
.verse cite{display:block;margin-top:.7em;font-family:var(--serif);font-style:normal;font-weight:600;letter-spacing:0;text-transform:none;color:var(--mute)}
.concl{list-style:decimal;margin:0;padding:0 0 0 1.4em;display:grid;gap:.9em;counter-reset:none}
.concl li{display:list-item;position:static;padding:0 0 0 .3em;border-radius:0;background:none;counter-increment:none;color:#242424}
.concl li::before{content:none}
.concl li::marker{font-weight:700;color:var(--ink)}
.concl strong{font-weight:700;color:var(--ink)}
.pic{margin:1.8em 0}
.vid{margin:1.8em 0;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#000}
.vid iframe{display:block;width:100%;height:100%;border:0}
.bul{list-style:disc;margin:.2em 0 1.3em;padding:0 0 0 1.3em;display:grid;gap:.5em}
.bul li{display:list-item;padding-left:.2em}
.bul li::marker{color:var(--mute)}
.sec a{color:var(--teal-ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.sec a:hover{color:var(--ink)}
.sec strong{font-weight:800}
.pic img{border-radius:6px}
.end-meta{display:grid;gap:14px;margin-top:8px;padding-top:28px;border-top:1px solid var(--line)}
.end-meta .tags{display:flex;flex-wrap:wrap;gap:8px}
.end-meta .tags a{display:inline-flex;align-items:center;height:34px;padding:0 15px;border-radius:999px;background:rgba(20,20,20,.06);text-decoration:none;font-weight:600;font-size:14px;letter-spacing:-.01em;color:var(--ink);transition:background .2s ease}
.end-meta .tags a:hover,.end-meta .tags a:focus-visible{background:rgba(20,20,20,.13);color:var(--ink);text-decoration:none}
.end-meta .tags a:active{background:rgba(20,20,20,.18)}
.end-meta .meta{font-weight:600;font-size:14px;color:var(--mute)}
.fb{display:flex;justify-content:flex-start;margin-top:8px}
.rel{margin-top:16px}
@media (max-width:720px){.pg{padding-top:112px;gap:56px}.hd{margin-bottom:36px}.hero{margin-bottom:40px}.art{gap:44px}}
"""

CSS_B = """
/* B · «Medium»: одна вузька колонка, текст у Manrope, вірші — шрифт із засічками */
:root{--serif:"Source Serif 4",Charter,"Iowan Old Style",Georgia,"Times New Roman",serif}
""" + MED_COMMON + """
.hero{width:min(680px,100%);aspect-ratio:16/9}
.art{width:min(680px,100%);font-size:20px;line-height:1.7}
.sec p,.sec p.idea,.qs li,.concl li{font-weight:500;font-size:20px;line-height:1.7;letter-spacing:-.012em}
.qs li{font-weight:700;letter-spacing:-.018em}
.verse{padding-left:22px;border-left:2px solid var(--ink)}
.verse p{font-style:italic;font-weight:400;font-size:22px;line-height:1.55;letter-spacing:0}
.verse cite{font-size:16px}
@media (max-width:720px){.art,.sec p,.sec p.idea,.qs li,.concl li{font-size:18px}.verse p{font-size:20px}}
""" + FB_CSS

CSS_C = """
/* C · «Medium-журнал»: основний текст із засічками, питання й заголовки — Manrope, вірші по центру між тонкими лініями */
:root{--serif:"Source Serif 4",Charter,"Iowan Old Style",Georgia,"Times New Roman",serif}
""" + MED_COMMON + """
.hero{width:min(1040px,100%);aspect-ratio:21/9}
.art{width:min(700px,100%)}
.sec p,.sec p.idea,.concl li{font-family:var(--serif);font-weight:400;font-size:21px;line-height:1.72;letter-spacing:0}
.sec p.hint,.qs .hint{font-family:var(--serif)}
.qs li{font-family:var(--sans);font-weight:700;font-size:20px;line-height:1.5;letter-spacing:-.02em}
.verse{margin:2em 0;padding:26px 0;border-block:1px solid var(--line);text-align:center}
.verse p{font-style:italic;font-weight:400;font-size:clamp(21px,2vw,25px);line-height:1.55;letter-spacing:0;text-wrap:balance}
.verse cite{font-size:13px;letter-spacing:.1em;text-transform:uppercase;margin-top:.9em}
@media (max-width:720px){.sec p,.sec p.idea,.concl li{font-size:19px}.qs li{font-size:18px}.hero{aspect-ratio:16/10}}
""" + FB_CSS

def page_med(t, secs, rel, sample, path, css):
    date, tags, books = meta_html(t)
    body = "".join(f'<section class="sec {s["kind"]}" id="{s["id"]}" aria-labelledby="{s["id"]}-h"><h2 id="{s["id"]}-h">{esc(s["title"])}</h2>{s["html"]}</section>' for s in secs)
    hero = f'<figure class="hero"><img src="{esc(t["hero"])}" alt="{esc(t["title"])}" width="1400" height="790" fetchpriority="high"></figure>' if t.get("hero") else ""
    lede = f'<p class="lede">{esc(t["excerpt"])}</p>' if t.get("excerpt") else ""
    inner = f"""<main class="pg"><div class="wrap">
<header class="hd">{crumbs_html(t)}<h1>{esc(t["title"])}</h1>{lede}</header>
{hero}
<article class="art">{body}
<footer class="end-meta"><div class="tags">{tags}</div>{date}</footer>
<div class="fb"><button class="ghost" type="button" id="fb-open" aria-haspopup="dialog">Залишити відгук про тему</button></div></article>
</div>
<div class="wrap">{related_html(t, rel)}</div></main>
{fb_modal(t)}"""
    return head(t, path, sample, css, SERIF_LINK) + footer_tail(inner, FB_JS)

CSS_D = """
/* D · лише Manrope: одна колонка, вірші виділені вагою, розміром і тонкою лінією (без курсиву й засічок) */
:root{--serif:var(--sans)}
""" + MED_COMMON + """
.hero{width:min(720px,100%);aspect-ratio:16/9}
.art{width:min(680px,100%)}
.sec p,.sec p.idea,.concl li{font-weight:500;font-size:19px;line-height:1.75;letter-spacing:-.012em}
.qs li{font-weight:700;font-size:19px;line-height:1.55;letter-spacing:-.018em}
.sec p.hint,.qs .hint{font-weight:500;font-style:normal;font-size:19px;line-height:1.75;letter-spacing:-.012em;color:var(--mute)}
.verse{margin:1.8em 0;padding:2px 0 2px 24px;border-left:3px solid var(--ink)}
.verse p{font-weight:600;font-size:clamp(20px,1.9vw,23px);line-height:1.5;letter-spacing:-.025em}
.verse cite{margin-top:.8em;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
@media (max-width:720px){.sec p,.sec p.idea,.concl li,.qs li{font-size:17.5px}.sec p.hint,.qs .hint{font-size:17.5px}.verse{padding-left:18px}}
""" + FB_CSS

def page_d(t, secs, rel, sample, path):
    return page_med(t, secs, rel, sample, path, CSS_D).replace(SERIF_LINK, "")

CSS_E = CSS_D + """
/* E · D + динамічний зміст ліворуч, згортні «Висновки» і «Виклик», цитати звичайного розміру */
.hero{width:100%;aspect-ratio:16/9;margin:0 0 56px}
.hero,.pic img,.vid{border-radius:18px}
@media (max-width:720px){.hero,.pic img,.vid{border-radius:14px}}
.lay{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,700px) minmax(0,1fr);column-gap:48px;align-items:start}
.side{grid-column:1;justify-self:start;max-width:300px;position:sticky;top:104px;display:grid;gap:26px}
.toc{display:grid;gap:14px}
.em{display:none}.emo-on .em{display:inline}
.emt{position:relative;display:flex;align-items:center;gap:10px;margin-left:10px}
.swk{position:relative;display:inline-flex}
.sw{z-index:1}
.egg{position:absolute;left:50%;bottom:calc(100% - 3px);width:34px;margin-left:-17px;height:42px;overflow:hidden;pointer-events:none}
.egg img{position:absolute;left:0;bottom:0;width:100%;height:auto;transform:translateY(105%);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.egg.on img{transform:none}
.emt .lbl{text-transform:none;letter-spacing:-.01em;font-size:14px}
.sw{position:relative;width:34px;height:20px;padding:0;border:0;border-radius:999px;background:#CFCDC4;cursor:pointer;transition:background .2s ease}
.sw::after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s ease}
.sw[aria-checked="true"]{background:var(--ink)}.sw[aria-checked="true"]::after{transform:translateX(14px)}
.sw:focus-visible{outline:2px solid var(--teal);outline-offset:3px}
.fb{justify-content:flex-start;align-items:center;gap:12px;flex-wrap:wrap}
.pdf{gap:10px;text-decoration:none}
.pdf svg{width:18px;height:18px;flex:none}
.src{display:none}
.lbl{font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.toc a{display:block;padding:7px 0 7px 14px;border-left:2px solid var(--line);text-decoration:none;font-weight:600;font-size:15px;line-height:1.3;letter-spacing:-.02em;color:var(--mute);transition:color .2s ease,border-color .2s ease}
.toc a:hover,.toc a.on{color:var(--ink);border-color:var(--teal)}
.lay .art{width:100%}
.lay .main{grid-column:2;min-width:0}
.qs li{font-size:clamp(20px,1.8vw,23px);line-height:1.45}
.verse p{font-weight:500;font-size:19px;line-height:1.75;letter-spacing:-.012em}
.verse cite{margin-top:.2em;font-weight:500;font-size:19px;line-height:1.75;letter-spacing:-.012em;text-transform:none;color:var(--mute)}
.bul li{font-weight:500;font-size:19px;line-height:1.75;letter-spacing:-.012em;color:#242424}
@media (max-width:720px){.bul li{font-size:17.5px}}
.fold{border-top:1px solid var(--line)}
.fold:last-child{border-bottom:1px solid var(--line)}
.fold summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 0;cursor:pointer;list-style:none;font-weight:700;font-size:19px;letter-spacing:-.02em}
.fold summary::-webkit-details-marker{display:none}
.fold summary::after{content:"+";font-weight:500;font-size:26px;line-height:1;color:var(--mute)}
.fold[open] summary::after{content:"\\2212"}
.fold summary:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
.fold-b{padding:2px 0 14px}
@media (max-width:1280px){.lay{grid-template-columns:minmax(0,700px);justify-content:center}.side{position:static;max-width:none;margin-bottom:8px}.toc{display:none}.lay .main{grid-column:1}}
@page{size:A4;margin:16mm 15mm}
@media print{
  site-menu,site-footer,.side,.emt,.hero,.fb,.rel,.crumbs,#fb-m{display:none!important}
  html,body,.end,.hold,.pg{background:#fff!important}.art{gap:16pt}
  .pg{padding:0!important;gap:0!important}.wrap{width:auto!important}
  .lay{display:block}.lay .main,.art{width:auto;max-width:none}
  .hd{margin:0 0 18pt;gap:8pt}.hd h1{font-size:28pt}.lede{font-size:12pt}
  .sec{break-inside:auto;margin-bottom:14pt}.sec h2{break-after:avoid;font-size:17pt}
  .qs li,.verse,.pic{break-inside:avoid}
  .sec p,.sec p.idea,.concl li{font-size:11pt;line-height:1.55}.qs li{font-size:12pt}.verse p,.verse cite{font-size:11pt}
  .fold summary::after,.fold[open] summary::after{content:none!important}.fold{border-color:#ccc}
  .end-meta{margin-top:10pt}
  .src{display:block;margin-top:16pt;font-size:9pt;color:#777}
}
@media (max-width:760px){.lay{grid-template-columns:minmax(0,1fr)}}
"""

DL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>'

PDF_JS = r"""
/* «Завантажити PDF»: файл збирається в браузері з тексту сторінки в момент кліку (pdfmake підвантажується лише тоді) */
(()=>{
const btn=document.getElementById("pdf-btn");if(!btn)return;
const label=btn.querySelector("span"),orig=label.textContent;
const loadJs=src=>new Promise((ok,no)=>{if(window.pdfMake)return ok();const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
const b64=buf=>{let s="";const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)};
const runs=(node,st)=>{st=st||{};const out=[];node.childNodes.forEach(n=>{
  if(n.nodeType===3){if(n.textContent)out.push(Object.assign({text:n.textContent},st));return}
  if(n.nodeType!==1)return;const c=n.classList;if(c.contains("em")||c.contains("hint"))return;
  const t=n.tagName;
  if(t==="STRONG"||t==="B")out.push(...runs(n,Object.assign({},st,{bold:true})));
  else if(t==="EM"||t==="I")out.push(...runs(n,Object.assign({},st,{italics:true})));
  else if(t==="A")out.push(...runs(n,Object.assign({},st,{link:n.href,color:"#28697A",decoration:"underline"})));
  else out.push(...runs(n,st))});return out};
const plain=el=>{const c=el.cloneNode(true);c.querySelectorAll(".em,.hint").forEach(x=>x.remove());return c.textContent.replace(/\s+/g," ").trim()};
const photo=async src=>{const bl=await (await fetch(src)).blob(),bm=await createImageBitmap(bl),k=Math.min(1,1000/bm.width),c=document.createElement("canvas");c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(bm,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.85)};
const conv=async el=>{const t=el.tagName,c=el.classList,out=[];
  if(t==="P")out.push({text:runs(el),style:c.contains("hint")?"hint":"p"});
  else if(t==="H3")out.push({text:plain(el),style:"h3"});
  else if(t==="OL"&&c.contains("qs"))el.querySelectorAll(":scope>li").forEach(li=>{out.push({text:runs(li),style:"q"});const h=li.querySelector(".hint");if(h)out.push({text:plain(h),style:"hint"})});
  else if(t==="UL")out.push({ul:[...el.children].map(li=>({text:runs(li)})),style:"p"});
  else if(t==="OL")out.push({ol:[...el.children].map(li=>({text:runs(li)})),style:"p"});
  else if(t==="BLOCKQUOTE"){const p=el.querySelector("p"),ci=el.querySelector("cite");
    out.push({table:{widths:[2,"*"],body:[[{text:"",fillColor:"#141414",border:[false,false,false,false]},{stack:[{text:runs(p),style:"verse"}].concat(ci?[{text:plain(ci),style:"cite"}]:[]),border:[false,false,false,false],margin:[8,0,0,0]}]]},layout:"noBorders",margin:[0,4,0,10]})}
  else if(t==="DETAILS"){out.push({text:plain(el.querySelector("summary")),style:"h3"});for(const ch of el.querySelector(".fold-b").children)out.push(...await conv(ch))}
  else if(t==="FIGURE"&&c.contains("pic")){const im=el.querySelector("img");try{out.push({image:await photo(im.src),fit:[499,340],margin:[0,4,0,10]})}catch(e){}}
  else if(t==="FIGURE"&&c.contains("vid")){const m=(el.querySelector("iframe").src.match(/embed\/([\w-]+)/)||[])[1];if(m)out.push({text:"Відео: https://youtu.be/"+m,link:"https://youtu.be/"+m,color:"#28697A",style:"p"})}
  return out};
btn.addEventListener("click",async()=>{
  if(btn.disabled)return;btn.disabled=true;label.textContent="Готуємо PDF…";
  try{
    const [,r,b]=await Promise.all([loadJs("vendor/pdfmake.min.js"),fetch("hgthemes/pdf/Manrope-Regular.ttf?v=3").then(r=>r.arrayBuffer()),fetch("hgthemes/pdf/Manrope-Bold.ttf?v=3").then(r=>r.arrayBuffer())]);
    window.pdfMake.vfs={"Manrope-Regular.ttf":b64(r),"Manrope-Bold.ttf":b64(b)};
    window.pdfMake.fonts={Manrope:{normal:"Manrope-Regular.ttf",bold:"Manrope-Bold.ttf",italics:"Manrope-Regular.ttf",bolditalics:"Manrope-Bold.ttf"}};
    const content=[{text:document.querySelector("h1").textContent,style:"h1"}];
    const lede=document.querySelector(".lede");if(lede)content.push({text:plain(lede),style:"lede"});
    const hero=document.querySelector(".hero img");if(hero){try{content.push({image:await photo(hero.currentSrc||hero.src),width:499,margin:[0,0,0,14]})}catch(e){}}
    for(const sec of document.querySelectorAll(".art .sec")){
      const h2=sec.querySelector("h2");content.push({text:plain(h2),style:"h2",tocItem:false});
      for(const ch of sec.children){if(ch!==h2)content.push(...await conv(ch))}}
    const tags=[...document.querySelectorAll(".end-meta .tags a")].map(a=>a.textContent).join(" · "),dt=document.querySelector(".end-meta time");
    if(tags||dt)content.push({text:[tags,dt?dt.textContent:""].filter(Boolean).join("\n"),style:"hint",margin:[0,16,0,0]});
    const url=(document.querySelector('link[rel="canonical"]')||{}).href||location.href;
    const doc={pageSize:"A4",pageMargins:[48,52,48,58],content,defaultStyle:{font:"Manrope",fontSize:10.5,lineHeight:1.4,color:"#242424"},
      styles:{h1:{fontSize:26,bold:true,alignment:"center",margin:[0,0,0,8]},lede:{fontSize:12,color:"#85837E",alignment:"center",margin:[0,0,0,14]},h2:{fontSize:16,bold:true,color:"#141414",margin:[0,18,0,8]},h3:{fontSize:12.5,bold:true,color:"#141414",margin:[0,10,0,4]},
        p:{margin:[0,0,0,7]},q:{bold:true,fontSize:11.5,color:"#141414",margin:[0,8,0,3]},hint:{color:"#85837E",margin:[0,0,0,6]},verse:{margin:[0,0,0,3]},cite:{color:"#85837E",fontSize:10}},
      footer:(cur,total)=>({columns:[{text:url,color:"#999",fontSize:8,margin:[48,0,0,0]},{text:cur+" / "+total,color:"#999",fontSize:8,alignment:"right",margin:[0,0,48,0]}],margin:[0,22,0,0]})};
    window.pdfMake.createPdf(doc).download(url.replace(/\/+$/,"").split("/").pop()+".pdf");
    label.textContent=orig;
  }catch(e){console.error(e);label.textContent="Не вдалося. Ще раз?";setTimeout(()=>label.textContent=orig,3000)}
  btn.disabled=false});
})();
"""

def page_e(t, secs, rel, sample, path):
    date, tags, books = meta_html(t)
    toc = "".join(f'<a href="{path}#{s["id"]}">{esc(s["title"])}</a>' for s in secs)
    body = "".join(f'<section class="sec {s["kind"]}" id="{s["id"]}" aria-labelledby="{s["id"]}-h"><h2 id="{s["id"]}-h">{em(s["emo"] + " ") if s.get("emo") else ""}{esc(s["title"])}</h2>{s.get("html_fold") or s["html"]}</section>' for s in secs)
    hero = f'<figure class="hero"><img src="{esc(t["hero"])}" alt="{esc(t["title"])}" width="1400" height="790" fetchpriority="high"></figure>' if t.get("hero") else ""
    lede = f'<p class="lede">{esc(t["excerpt"])}</p>' if t.get("excerpt") else ""
    TOGGLE = ('''<div class="emt"><span class="lbl" id="emt-l">Емоджі</span><span class="swk"><span class="egg" aria-hidden="true" hidden><img src="hgthemes/img/egg.webp" alt=""></span><button class="sw" type="button" role="switch" aria-checked="false" aria-labelledby="emt-l"></button></span></div>''') if 'class="em"' in body else ""
    inner = f"""<main class="pg"><div class="wrap">
<header class="hd">{crumbs_html(t)}<h1>{esc(t["title"])}</h1>{lede}</header>
<div class="lay">
<div class="side">{('<nav class="toc" aria-label="Зміст теми"><p class="lbl">Зміст</p>' + toc + '</nav>') if len(secs) > 1 else ""}</div>
<div class="main">{hero}<article class="art">{body}
<footer class="end-meta"><div class="tags">{tags}</div>{date}</footer>
<div class="fb"><button class="ghost" type="button" id="fb-open" aria-haspopup="dialog">Залишити відгук про тему</button><button class="ghost pdf" type="button" id="pdf-btn">{DL_ICON}<span>Завантажити PDF</span></button>{TOGGLE}</div>
<p class="src">Джерело: {SITE}/homegroups_themes/{t["slug"]}/</p></article></div>
</div></div>
<div class="wrap">{related_html(t, rel)}</div></main>
{fb_modal(t)}"""
    spy = """const L=[...document.querySelectorAll(".toc a")],S=L.map(a=>document.getElementById(a.hash.slice(1)));
const spy=()=>{const y=innerHeight*.3;let c=0;S.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<=y)c=i});L.forEach((a,i)=>a.classList.toggle("on",i===c))};
addEventListener("scroll",spy,{passive:true});spy();
const R=document.documentElement,sw=document.querySelector(".sw")||{setAttribute(){},addEventListener(){},getAttribute(){}},pdf=/[?&]pdf\\b/.test(location.search);
let on=false;   /* емоджі завжди вимкнені при відкритті сторінки; стан не запам'ятовується */
const setE=v=>{R.classList.toggle("emo-on",v);sw.setAttribute("aria-checked",String(v));};
const egg=document.querySelector(".egg"),hits=[];let eggT;
sw.addEventListener("click",()=>{const v=sw.getAttribute("aria-checked")!=="true";setE(v);
  if(v&&egg){const n=Date.now();hits.push(n);while(hits.length&&n-hits[0]>10000)hits.shift();
    if(hits.length>=5){hits.length=0;egg.hidden=false;setTimeout(()=>egg.classList.add("on"),40);clearTimeout(eggT);eggT=setTimeout(()=>{egg.classList.remove("on");setTimeout(()=>egg.hidden=true,400)},5000)}}});setE(on);
const openAll=()=>document.querySelectorAll("details.fold").forEach(d=>d.open=true);if(pdf)openAll();addEventListener("beforeprint",openAll);
"""
    return head(t, path, sample, CSS_E) + footer_tail(inner, spy + FB_JS + PDF_JS)

def page_b(t, secs, rel, sample, path): return page_med(t, secs, rel, sample, path, CSS_B)
def page_c(t, secs, rel, sample, path): return page_med(t, secs, rel, sample, path, CSS_C)

PAGES = {"A": page_a, "B": page_b, "C": page_c, "D": page_d, "E": page_e}

# ---------- запуск ----------
def load():
    cache = json.loads((ROOT / "hgthemes/cache.json").read_text(encoding="utf-8"))
    data = json.loads((ROOT / "hgthemes/data.json").read_text(encoding="utf-8"))
    tagLabels = {t["id"]: t["label"] for t in data["tags"]}
    items = {i["url"]: i for i in data["items"]}
    themes = {}
    for url, i in items.items():
        c = cache.get(url, {})
        themes[url] = {"url": url, "slug": slug_of(url), "title": i["title"], "date": i["date"], "tags": [x for x in i["tags"] if x != "guests"] + (["guests"] if "guests" in i["tags"] else []),
                       "tagLabels": tagLabels, "refs": i["refs"], "excerpt": i["excerpt"], "text": i.get("text", ""), "img": i["img"], "lang": i.get("lang", "uk"), "imgsrc": c.get("imgsrc"), "doc": c.get("doc") or {}}
    return themes

def related_for(t, themes, n=3):
    mine = set(x for x in t["tags"] if x != "guests")
    sc = []
    for u, o in themes.items():
        if u == t["url"] or not o["img"]: continue
        s = len(mine & set(o["tags"]))
        if s: sc.append((-s, o["date"] == "", abs(int(o["date"][:4]) - int(t["date"][:4])), o["title"], o))
    sc.sort(key=lambda x: (x[0], x[2], x[3]))
    return [{"url": o["url"], "title": o["title"], "date": o["date"], "img": o["img"]} for *_, o in sc[:n]]

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "sample"
    themes = load()
    leg_file = ROOT / "hgthemes/legacy_format.json"
    if not leg_file.exists():   # одноразово: теми, що існували на момент міграції, зберігають жирний/курсив з оригіналу
        leg_file.write_text(json.dumps(sorted(t["slug"] for t in themes.values()), ensure_ascii=False), encoding="utf-8")
    legacy = set(json.loads(leg_file.read_text(encoding="utf-8")))
    SLUGS.update(t["slug"] for t in themes.values())
    if mode == "sample":
        t = next(v for v in themes.values() if v["slug"] == "vid-bukvi-do-lyubovi")
        t["hero"] = hero_image(t)
        secs = sections_of(t["doc"]); rel = related_for(t, themes); CUR["legacy"] = t["slug"] in legacy
        for v, fn in PAGES.items():
            path = f"homegroup-theme-{v.lower()}.html"
            (ROOT / path).write_text(fn(t, secs, rel, True, path), encoding="utf-8")
            print("записано", path)
    elif mode == "all":
        v = (sys.argv[2] if len(sys.argv) > 2 else "E").upper(); fn = PAGES[v]; n = 0
        for t in themes.values():
            t["hero"] = hero_image(t); secs = sections_of(t["doc"]); rel = related_for(t, themes); CUR["legacy"] = t["slug"] in legacy
            for r in rel: r["url"] = f"homegroups_themes/{slug_of(r['url'])}/"
            d = ROOT / "homegroups_themes" / t["slug"]; d.mkdir(parents=True, exist_ok=True)
            (d / "index.html").write_text(fn(t, secs, rel, False, f"homegroups_themes/{t['slug']}/"), encoding="utf-8"); n += 1
        urls = "".join(f"<url><loc>{SITE}/homegroups_themes/{esc(t['slug'])}/</loc><lastmod>{t['date']}</lastmod></url>\n" for t in themes.values())
        (ROOT / "sitemap-homegroup-themes.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n", encoding="utf-8")
        print("згенеровано сторінок:", n, "+ sitemap-homegroup-themes.xml")

if __name__ == "__main__":
    main()
