#!/usr/bin/env python3
"""Сторінки записів блогу: статичний HTML для кожного запису (як сторінки тем домашніх груп — текст і мікророзмітка лежать у HTML).

  python3 build-blog-pages.py               # усі записи → blog/<slug> + sitemap-blog.xml
  додайте --refresh, щоб заново забрати тексти зі старого сайту (інакше береться кеш blog/raw.json.gz)

Список записів, формати й теми — з blog/data.js (його збирає update-blog.py). Тут — лише повний текст і сторінка.
Текст чиститься: лишаються абзаци, підзаголовки, списки, цитати, жирний/курсив, посилання, фото й відео YouTube;
слайдери, чужі вбудовування й службова розмітка старого сайту відкидаються.
"""
import json, re, sys, html, io, gzip, hashlib, pathlib, urllib.request, urllib.parse
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent
BLOG = ROOT / "blog"
# розділ, до якого належать сторінки (build-library-pages.py підміняє його для відеобібліотеки й архіву подій)
CTX = {"name": "Блог", "href": "/category/vse_zapisi/", "suffix": "Блог церкви «Філадельфія»", "imgdir": "blog", "css": ["blog/section-blog.css"]}
SITE = "https://philad.org"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}
esc = lambda s: html.escape(str(s if s is not None else ""), quote=True)
MON = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"]
def fmt_date(d):
    y, m, dd = map(int, d.split("-")); return f"{dd} {MON[m - 1]} {y}"
def get(url):
    return urllib.request.urlopen(urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%#,"), headers=UA), timeout=40).read()

# ---------- дані ----------
def load_data():
    js = (BLOG / "data.js").read_text("utf-8")
    D = {k: json.loads(re.search(rf"^{k}:(.+?),?$", js, re.M).group(1)) for k in ("TABS", "KINDS", "THEMES")}
    D["posts"] = [json.loads(l.strip().rstrip(",")) for l in js.split("posts:[")[1].splitlines() if l.strip().startswith("{")]
    return D

def load_raw(refresh):
    f = BLOG / "raw.json.gz"
    if f.exists() and not refresh: return json.loads(gzip.decompress(f.read_bytes()))
    raw, page = {}, 1
    while True:
        try: part = json.loads(get(f"{SITE}/wp-json/wp/v2/posts?categories=4,35,33,64,5,61,366,1&per_page=100&page={page}&_embed=wp:featuredmedia&_fields=id,slug,content,_links,_embedded"))
        except Exception: break
        if not isinstance(part, list) or not part: break
        for p in part:
            fm = (p.get("_embedded", {}).get("wp:featuredmedia") or [{}])[0]
            raw[str(p["id"])] = {"slug": urllib.parse.unquote(p["slug"]), "html": p["content"]["rendered"], "img": fm.get("source_url", "")}
        if len(part) < 100: break
        page += 1
    f.write_bytes(gzip.compress(json.dumps(raw, ensure_ascii=False).encode()))
    return raw

def local_img(src, sub, width):
    """картинку зі старого сайту кладемо поруч (webp), один раз"""
    d = ROOT / CTX["imgdir"] / "img" / sub; d.mkdir(parents=True, exist_ok=True)
    name = hashlib.sha1(src.encode()).hexdigest()[:12] + ".webp"
    if not (d / name).exists():
        from PIL import Image, ImageOps
        for u in (re.sub(r"-\d+x\d+(\.\w+)$", r"\1", src), src):
            try:
                im = ImageOps.exif_transpose(Image.open(io.BytesIO(get(u)))).convert("RGB")
                if im.width < 260: return None
                if im.width > width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
                im.save(d / name, "WEBP", quality=78, method=5); break
            except Exception: continue
        else: return None
    from PIL import Image
    w, h = Image.open(d / name).size
    return {"src": f"{CTX['imgdir']}/img/{sub}/{name}", "w": w, "h": h}

# ---------- текст запису → блоки ----------
YT = re.compile(r"(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=|v/)|youtu\.be/)([\w-]{11})")
INL = {"strong": "strong", "b": "strong", "em": "em", "i": "em", "sup": "sup"}
class Clean(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out = []; s.buf = []; s.open = []; s.skip = 0; s.head = 0; s.bq = 0; s.lists = []
    def flush(s):
        txt = "".join(s.buf); s.buf = []
        for t in reversed(s.open): txt += f"</{t.split()[0]}>"
        txt = re.sub(r"\s+", " ", txt.replace("\xa0", " ").replace("­", "")).strip()
        txt = re.sub(r"<(strong|em|sup)>\s*</\1>", "", txt)
        s.buf = [f"<{t}>" for t in s.open]
        if not re.sub(r"<[^>]+>", "", txt).strip(): return
        if s.head: s.out.append({"t": "h2" if s.head <= 2 else "h3", "html": re.sub(r"</?(strong|em)>", "", txt)})
        elif s.lists: s.lists[-1]["items"].append(txt)
        elif s.bq: s.out.append({"t": "quote", "html": re.sub(r"</?(strong|em)>", "", txt)})
        else: s.out.append({"t": "p", "html": txt})
    def handle_starttag(s, tag, a):
        a = dict(a)
        if tag in ("script", "style", "noscript", "form", "button", "svg", "figcaption"): s.skip += 1; return
        if s.skip: return
        if tag in ("p", "div", "br", "blockquote", "ul", "ol", "li", "table", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "img", "iframe", "meta"): s.flush()
        if re.fullmatch(r"h[1-6]", tag): s.head = int(tag[1])
        elif tag == "blockquote": s.bq += 1
        elif tag in ("ul", "ol"): s.lists.append({"t": tag, "items": []}); s.out.append(s.lists[-1])
        elif tag in INL: s.open.append(INL[tag]); s.buf.append(f"<{INL[tag]}>")
        elif tag == "a" and re.match(r"https?://", a.get("href", "")) and not re.search(r"\.(jpe?g|png|gif|webp)$", a["href"], re.I):
            s.open.append(f'a href="{esc(a["href"])}"'); s.buf.append(f'<a href="{esc(a["href"])}" target="_blank" rel="noopener">')
        elif tag == "img" and a.get("src"): s.out.append({"t": "img", "src": a["src"], "alt": a.get("alt", "")})
        elif tag in ("iframe", "meta"):
            m = YT.search(a.get("src") or a.get("content") or "")
            if m and (tag == "iframe" or a.get("itemprop") == "embedURL"): s.out.append({"t": "vid", "id": m.group(1)})
    def handle_endtag(s, tag):
        if tag in ("script", "style", "noscript", "form", "button", "svg", "figcaption"): s.skip = max(0, s.skip - 1); return
        if s.skip: return
        t = INL.get(tag, tag)
        if t in ("strong", "em", "sup", "a"):
            for i in range(len(s.open) - 1, -1, -1):
                if s.open[i].split()[0] == t:
                    for x in reversed(s.open[i:]): s.buf.append(f"</{x.split()[0]}>")
                    rest = s.open[i + 1:]; s.open = s.open[:i] + rest; s.buf += [f"<{x}>" for x in rest]; break
            return
        if tag in ("p", "div", "blockquote", "ul", "ol", "li", "table", "tr") or re.fullmatch(r"h[1-6]", tag): s.flush()
        if re.fullmatch(r"h[1-6]", tag): s.head = 0
        elif tag == "blockquote": s.bq = max(0, s.bq - 1)
        elif tag in ("ul", "ol") and s.lists: s.lists.pop()
    def handle_data(s, d):
        if not s.skip: s.buf.append(esc(d).replace("&#x27;", "’").replace("&quot;", '"'))

plain = lambda h: html.unescape(re.sub(r"<[^>]+>", "", h)).strip()
AUTHOR = re.compile(r"^(?:Автор(?: статті)?|Пастор|Підготува[вл]а?)\s*:\s*(.{3,60})$")
def parse(post, raw):
    c = Clean(); c.feed(re.sub(r"\[/?[a-z_]+[^\]]*\]", "", raw["html"])); c.flush()
    feat = re.sub(r"-\d+x\d+(?=\.\w+$)", "", raw.get("img", "").rsplit("/", 1)[-1])
    out, doc, seen, ref = [], {"author": ""}, set(), ""
    for b in c.out:
        if b["t"] in ("ul", "ol"):
            if b["items"]: out.append(b)
            continue
        if b["t"] == "img":
            base = re.sub(r"-\d+x\d+(?=\.\w+$)", "", b["src"].rsplit("/", 1)[-1])
            if base == feat or base in seen: continue
            seen.add(base); im = local_img(b["src"], "post", 1400)
            if im: out.append({"t": "img", **im, "alt": b["alt"]})
            continue
        if b["t"] == "vid":
            if b["id"] not in seen: seen.add(b["id"]); out.append(b)
            continue
        h, t = b["html"], plain(b["html"])
        if re.fullmatch(r"(https?://|www\.)\S+", t) or t.lower() in (post["title"].lower(), "читати далі"): continue
        m = AUTHOR.match(t)
        if m and len(out) < 4 and not doc["author"]: doc["author"] = m.group(1).strip(" ."); continue
        if b["t"] == "p" and ref: b = {"t": "quote", "html": h, "cite": re.sub(r":\s+", ":", re.sub(r"\s*([–-])\s*", r"\1", ref))}; ref = ""
        elif b["t"] == "p":
            if re.fullmatch(r"<strong>.*</strong>", h) and h.count("<strong>") == 1:
                inner = h[8:-9]
                if re.fullmatch(r"Частина[- ]?\d+", t): continue
                if re.fullmatch(r"(?:\d )?[А-ЯІЇЄа-яіїє’.]{2,14}\.? \d+:\s?[\d\s,–-]+", t): ref = t; continue
                if t.startswith(("—", "–", "-")): b = {"t": "p", "html": inner, "cls": "ask"}
                elif len(t) < 110 and not t.endswith((".", ",", ";")) and not re.match(r"^\S+ \d+:", t): b = {"t": "h3", "html": inner}
            elif re.fullmatch(r"<em>.*</em>", h) and h.count("<em>") == 1: b = {"t": "p", "html": h[4:-5]}
        out.append(b)
    # відео-запис: перше відео йде в шапку сторінки
    doc["yt"] = post.get("yt", "")
    if post["kind"] == "video":
        for i, b in enumerate(out):
            if b["t"] == "vid": doc["yt"] = b["id"]; out.pop(i); break
    # короткий перший абзац стає підзаголовком сторінки
    doc["lede"] = ""
    if out and out[0]["t"] == "p" and not out[0].get("cls") and 60 <= len(plain(out[0]["html"])) <= 330 and len(out) > 2:
        doc["lede"] = plain(out.pop(0)["html"])
    n = 0
    for b in out:
        if b["t"] in ("h2", "h3"): n += 1; b["id"] = f"r{n}"
    doc["blocks"] = out
    doc["toc"] = [(b["id"], plain(b["html"])) for b in out if b["t"] in ("h2", "h3")] if n >= 3 else []
    doc["hero"] = local_img(raw["img"], "hero", 1600) if raw.get("img") and post["kind"] != "video" else None
    return doc

def body_html(blocks):
    out, pics = [], []
    def flush():
        if pics:
            out.append(pics[0] if len(pics) == 1 else '<div class="gal">' + "".join(pics) + "</div>"); pics.clear()
    for b in blocks:
        t = b["t"]
        if t == "img": pics.append(f'<figure class="pic"><img src="{b["src"]}" width="{b["w"]}" height="{b["h"]}" alt="{esc(b["alt"])}" loading="lazy"></figure>'); continue
        flush()
        if t in ("h2", "h3"): out.append(f'<{t} id="{b["id"]}">{b["html"]}</{t}>')
        elif t == "quote": out.append(f'<blockquote class="verse"><p>{b["html"]}</p>' + (f'<cite>{esc(b["cite"])}</cite>' if b.get("cite") else "") + '</blockquote>')
        elif t in ("ul", "ol"): out.append(f'<{t} class="bul">' + "".join(f"<li>{x}</li>" for x in b["items"]) + f"</{t}>")
        elif t == "vid": out.append(player(b["id"], "Відео"))
        else: out.append(f'<p{" class=ask" if b.get("cls") else ""}>{b["html"]}</p>')
    flush()
    return "".join(out)

def yt_thumb(yt):
    f = BLOG / "yt-thumbs.json"; C = json.loads(f.read_text()) if f.exists() else {}
    if yt not in C:
        C[yt] = "hqdefault"
        for n in ("maxresdefault", "sddefault"):
            try: get(f"https://i.ytimg.com/vi/{yt}/{n}.jpg"); C[yt] = n; break
            except Exception: pass
        f.write_text(json.dumps(C))
    return f"https://i.ytimg.com/vi/{yt}/{C[yt]}.jpg"

def player(yt, title, cls="vid"):
    """відео вантажиться лише після натискання: до того — кадр і кнопка"""
    return (f'<figure class="{cls}"><button type="button" class="yt" data-yt="{esc(yt)}" aria-label="Дивитись відео: {esc(title)}">'
            f'<img src="{yt_thumb(yt)}" alt="" loading="lazy">'
            '<span class="yt-b" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></button></figure>')

# ---------- сторінка ----------
# Стилі й скрипти сторінок — ЗАГАЛЬНІ файли: blog/base.css, blog/post.css, blog/post.js (+ section-*.css розділу з CTX['css']).
# У кожній згенерованій сторінці лише посилання на них, жодного вбудованого CSS чи JS.

def head(p, doc, D, canon, sample):
    title = f"{p['title']} — {D['KINDS'][p['kind']].lower()} | {CTX['suffix']}"
    desc = (doc["lede"] or p.get("text") or p["title"]).strip(); desc = desc if len(desc) <= 158 else desc[:158].rsplit(" ", 1)[0] + "…"
    img = f"{SITE}/{doc['hero']['src']}" if doc["hero"] else (yt_thumb(doc["yt"]) if doc["yt"] else "")
    tags = [D["THEMES"][t] for t in p["themes"]]
    crumbs = [("Головна", f"{SITE}/"), (CTX["name"], f"{SITE}/{CTX['href']}"), (p["title"], canon)]
    main = {"@context": "https://schema.org", "@type": "VideoObject" if p["kind"] == "video" and doc["yt"] else "Article", "description": desc,
            "inLanguage": "uk", "mainEntityOfPage": {"@type": "WebPage", "@id": canon},
            "publisher": {"@type": "Organization", "name": "Церква «Філадельфія»", "url": SITE, "logo": {"@type": "ImageObject", "url": f"{SITE}/logo-mark.png"}}}
    if main["@type"] == "VideoObject": main.update({"name": p["title"], "uploadDate": p["date"], "thumbnailUrl": [img], "embedUrl": f"https://www.youtube.com/embed/{doc['yt']}"})
    else: main.update({"headline": p["title"], "image": [img] if img else [], "datePublished": p["date"], "dateModified": p["date"], "articleSection": D["KINDS"][p["kind"]], "keywords": ", ".join(tags),
                       "author": {"@type": "Person", "name": doc["author"]} if doc["author"] else {"@type": "Organization", "name": "Церква «Філадельфія»", "url": SITE}})
    ld = [main, {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]}]
    og = [("og:type", "video.other" if main["@type"] == "VideoObject" else "article"), ("og:locale", "uk_UA"), ("og:site_name", "Церква «Філадельфія»"), ("og:title", p["title"]), ("og:description", desc), ("og:url", canon)]
    if img: og.append(("og:image", img))
    og += [("article:published_time", p["date"])] + [("article:tag", x) for x in tags]
    tw = [("twitter:card", "summary_large_image"), ("twitter:title", p["title"]), ("twitter:description", desc)] + ([("twitter:image", img)] if img else [])
    return f'''<!doctype html>
<html lang="{p.get("lang", "uk")}">
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
<link rel="stylesheet" href="blog/base.css">
<link rel="stylesheet" href="blog/post.css">
<link rel="stylesheet" href="components/lightbox.css">
{''.join(f'<link rel="stylesheet" href="{c}">' + chr(10) for c in CTX["css"])}</head>
'''

def kind_label(p, D): return "Відеоінтерв’ю" if p["kind"] == "video" and p.get("sub") == "interview" else D["KINDS"][p["kind"]]
def crumbs(p):
    return f'<nav class="crumbs" aria-label="Хлібні крихти"><ol><li><a href="/">Головна</a></li><li><a href="{CTX["href"]}">{CTX["name"]}</a></li><li aria-current="page">{esc(p["title"])}</li></ol></nav>'
def meta(p, doc):
    bits = [f'<time datetime="{p["date"]}">{fmt_date(p["date"])}</time>']
    if p.get("min"): bits.append(f'<span>{p["min"]} хв читання</span>')
    if doc["author"]: bits.append(f'<span>{esc(doc["author"])}</span>')
    return '<p class="meta">' + "".join(bits) + "</p>"
def tags(p, D):
    href = CTX.get("tag_url") or (lambda t: f'{CTX["href"]}#theme={t}')
    return '<div class="tags">' + "".join(f'<a href="{esc(href(t))}">{esc(D["THEMES"][t])}</a>' for t in p["themes"]) + "</div>"
def toc(doc): return ('<nav class="toc" aria-label="Зміст"><p class="lbl">Зміст</p>' + "".join(f'<a href="#{i}">{esc(t)}</a>' for i, t in doc["toc"]) + "</nav>") if doc["toc"] else ""
def hero(p, doc, cls="hero"):
    if p["kind"] == "video" and doc["yt"]: return player(doc["yt"], p["title"], cls + " vid")
    if doc["hero"]: return f'<figure class="{cls}"><img src="{doc["hero"]["src"]}" width="{doc["hero"]["w"]}" height="{doc["hero"]["h"]}" alt="{esc(p["title"])}" fetchpriority="high"></figure>'
    return ""
def end_meta(p, D):
    return f'<div class="end-meta">{tags(p, D)}</div>'
def related(p, rel, D, url):
    def card(r):
        im = f'<img src="{esc(r["img"])}" alt="" loading="lazy">' if r.get("img") else ""
        return (f'<article class="rc"><a class="rc-img" href="{esc(url(r))}" tabindex="-1" aria-hidden="true">{im}</a>'
                f'<p class="kick">{esc(kind_label(r, D))} <em>· {fmt_date(r["date"])}</em></p><h3><a href="{esc(url(r))}">{esc(r["title"])}</a></h3></article>')
    return f'<section class="rel" aria-labelledby="rel-h"><h2 id="rel-h">Читайте також</h2><div class="rc-grid">{"".join(card(r) for r in rel)}</div></section>' if rel else ""

# ---------- шаблон сторінки запису ----------
def page(p, doc, D, rel, nav, url):
    body, k, lede = body_html(doc["blocks"]), f'<p class="kick">{esc(kind_label(p, D))}</p>', (f'<p class="lede">{esc(doc["lede"])}</p>' if doc["lede"] else "")
    h1, R = f'<h1>{esc(p["title"])}</h1>', related(p, rel, D, url)
    has_text = any(b["t"] in ("p", "quote", "ul", "ol") for b in doc["blocks"])
    TOOLS = "" if not has_text else '<div class="tools"><p>Розмір тексту</p><div class="fz" role="group" aria-label="Розмір тексту"><button type="button" data-d="-1" aria-label="Менший текст">A</button><button type="button" data-d="1" aria-label="Більший текст">A</button></div></div>'
    PN = '<nav class="pn" aria-label="Сусідні записи">' + "".join(f'<a href="{esc(url(r))}"><span class="lbl">{lab}</span><b>{esc(r["title"])}</b></a>' if r else "<span></span>" for r, lab in ((nav[0], "← Попередній запис"), (nav[1], "Наступний запис →"))) + "</nav>"
    return f'''<main class="pg"><div class="wrap">
<header class="hd">{crumbs(p)}{k}{h1}{lede}{meta(p, doc)}</header>
<div class="lay"><div class="side">{toc(doc)}</div>
<div class="main">{hero(p, doc)}{TOOLS}<article class="art">{body}</article>{end_meta(p, D)}{PN}</div></div></div>
<div class="wrap">{R}</div></main>'''

def render(p, doc, D, rel, nav, url, canon, sample=False):
    """повна сторінка: шапка (мета, SEO) + меню + блок над футером (.end > .hold) + футер, що виїжджає з-під нього"""
    return head(p, doc, D, canon, sample) + f'''<body>
<site-menu tone="auto"></site-menu>
<div class="end"><div class="hold">
{page(p, doc, D, rel, nav, url)}
</div><site-footer></site-footer></div>
<script src="components/lightbox.js"></script>
<script src="blog/post.js"></script>
</body>
</html>
'''

def pick_related(p, posts):
    sc = lambda r: 3 * len(set(r["themes"]) & set(p["themes"])) + 2 * (r["kind"] == p["kind"]) + bool(r.get("img"))
    return sorted((r for r in posts if r["id"] != p["id"]), key=lambda r: (-sc(r), r["date"]), reverse=False)[:3]

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    D, raw = load_data(), load_raw("--refresh" in sys.argv)
    posts = D["posts"]; by = {p["id"]: p for p in posts}
    slug = lambda p: re.sub(r"[^\w-]+", "-", raw[str(p["id"])]["slug"]).strip("-")
    url = lambda r: r["page"]          # адреса запису = адреса зі старого сайту (update-blog.py)
    for i, p in enumerate(posts):
        doc = parse(p, raw[str(p["id"])]); d = ROOT / p["page"]; d.mkdir(parents=True, exist_ok=True)
        nav = (posts[i + 1] if i + 1 < len(posts) else None, posts[i - 1] if i else None)
        (d / "index.html").write_text(render(p, doc, D, pick_related(p, posts), nav, url, f"{SITE}/{url(p)}"), "utf-8")
    (ROOT / "sitemap-blog.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f'<url><loc>{SITE}/{url(p)}</loc><lastmod>{p["date"]}</lastmod></url>\n' for p in posts) + "</urlset>\n", "utf-8")
    (BLOG / "slugs.json").write_text(json.dumps({str(p["id"]): slug(p) for p in posts}, ensure_ascii=False), "utf-8")
    print(len(posts), "сторінок блогу")

if __name__ == "__main__":
    main()
