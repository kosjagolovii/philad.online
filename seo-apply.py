#!/usr/bin/env python3
"""SEO для основних сторінок сайту — одним проходом, можна запускати повторно.

  python3 seo-apply.py

Що робить:
  • у <head> кожної сторінки зі списку PAGES ставить <title>, description, canonical, Open Graph, Twitter Card, JSON-LD
    (блок між <!-- seo:start --> і <!-- seo:end -->, тож повторний запуск його просто оновлює);
  • збирає sitemap-pages.xml, sitemap.xml (індекс: сторінки + блог + теми груп), robots.txt;
  • збирає redirects.csv — старі адреси philad.org → нові (для 301 на хостингу).
Тексти й адреси змінюйте в PAGES нижче. Адреса сайту — SITE.
"""
import re, json, csv, html, pathlib, urllib.parse, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import urlmap

ROOT = pathlib.Path(__file__).resolve().parent
SITE = "https://philad.org"
OG = f"{SITE}/og.jpg"
ORG = "Церква «Філадельфія»"
SOCIAL = ["https://www.youtube.com/@philadkyiv", "https://www.instagram.com/philadkyiv", "https://www.facebook.com/philadkyiv/", "https://t.me/philadkyiv"]
esc = lambda s: html.escape(s, quote=True)

# файл: (title, description)
PAGES = {
 "index.html": ("Церква «Філадельфія» — євангельська церква в Києві", "Церква «Філадельфія» у Києві: зібрання щонеділі о 11:00, домашні групи, служіння для молоді й дітей, проповіді та онлайн-трансляції. Запрошуємо!"),
 "first-visit.html": ("Ви вперше у нас? — Церква «Філадельфія»", "Вперше у церкві «Філадельфія»? Розповідаємо, як дістатися, що чекає на недільному зібранні та з чого почати знайомство з церквою."),
 "about.html": ("Про церкву «Філадельфія» в Києві", "Про церкву «Філадельфія» в Києві: хто ми, чим живе наша спільнота і як долучитися."),
 "history.html": ("Історія церкви «Філадельфія» — від 1991 року", "Історія київської церкви «Філадельфія»: від перших зібрань у 1991–1992 роках до сучасної спільноти."),
 "ministries.html": ("Служіння церкви «Філадельфія»", "Усі служіння церкви «Філадельфія»: молодь, діти, сім’ї, молитва, допомога військовим і переселенцям. Знайдіть, де можна послужити."),
 "youth.html": ("PhiladYouth — молодіжне служіння церкви «Філадельфія»", "PhiladYouth — молодіжне служіння церкви «Філадельфія» у Києві: зустрічі, команди та домашні групи для молоді 16–25 років."),
 "homegroups.html": ("Домашні групи церкви «Філадельфія» у Києві", "Домашні групи — невеликі спільноти, що зустрічаються посеред тижня для спілкування, вивчення Біблії та молитви. Знайдіть групу у своєму районі."),
 "homegroup-themes.html": ("Теми домашніх груп — Церква «Філадельфія»", "Понад 570 тем для домашніх груп: питання для обговорення, вірші з Біблії та виклик на тиждень. Пошук за темами й книгами Біблії."),
 "events.html": ("Події церкви «Філадельфія» — афіша і календар", "Афіша подій церкви «Філадельфія» у Києві: служіння, семінари, зустрічі для молоді, сімей, сестер і дітей. Дати, місце та реєстрація."),
 "sermons.html": ("Проповіді церкви «Філадельфія»", "Проповіді церкви «Філадельфія» у відео: фільтр за спікером, темою, форматом і тривалістю."),
 "live.html": ("LIVE трансляція — Церква «Філадельфія»", "Дивіться зібрання церкви «Філадельфія» у прямому ефірі та записи трансляцій."),
 "donate.html": ("Пожертви — Церква «Філадельфія»", "Підтримати служіння церкви «Філадельфія»: онлайн-пожертва та банківські реквізити."),
 "contacts.html": ("Контакти — Церква «Філадельфія» у Києві", "Адреса церкви «Філадельфія»: Київ, вул. Голосіївська, 57. Електронна пошта, час зібрань і форма для заявки."),
 "seek-god.html": ("Пошук Бога — відео, запитання, перші кроки | Церква «Філадельфія»", "Кожна людина потребує Бога. Подивіться відео, напишіть нам, якщо з’явилися запитання, або залиште заявку, якщо хочете прийняти рішення про покаяння."),
 "blog.html": ("Блог — статті, свідоцтва, інтерв’ю та відео | Церква «Філадельфія»", "Блог церкви «Філадельфія» в Києві: статті, свідоцтва, інтерв’ю, відеоблоги та репортажі. Фільтр за рубриками й темами."),
 "videos.html": ("Відеобібліотека церкви «Філадельфія» — проповіді, навчання, інтерв’ю", "Відеобібліотека церкви «Філадельфія»: проповіді, навчання, інтерв’ю, історії людей і музика. Фільтр за темою, спікером, форматом і тривалістю."),
 "events-archive.html": ("Архів подій церкви «Філадельфія» 2014–2022", "Архів подій церкви «Філадельфія»: події 2014–2022 років — розповіді й фото. Пошук за назвою, роком і темою."),
 "privacy-policy.html": ("Політика конфіденційності | Церква «Філадельфія»", "Які дані збирає сайт церкви «Філадельфія», навіщо вони потрібні, кому передаються і як ви можете їх змінити чи видалити."),
}
CRUMB = {"youth.html": ("ministries.html", "Служіння"), "videos.html": ("Відеобібліотека церкви «Філадельфія» — проповіді, навчання, інтерв’ю", "Відеобібліотека церкви «Філадельфія»: проповіді, навчання, інтерв’ю, історії людей і музика. Фільтр за темою, спікером, форматом і тривалістю."),
 "events-archive.html": ("Архів подій церкви «Філадельфія» 2014–2022", "Архів подій церкви «Філадельфія»: події 2014–2022 років — розповіді й фото. Пошук за назвою, роком і темою."),
 "privacy-policy.html": None}

def url_of(f):
    """адреса сторінки на сайті = адреса зі старого philad.org (urlmap.py)"""
    return SITE + urlmap.url(f)

def block(f, title, desc):
    u = url_of(f); name = title.split(" — ")[0].split(" | ")[0]
    ld = []
    if f == "index.html":
        ld.append({"@context": "https://schema.org", "@type": "Church", "name": ORG, "url": SITE + "/", "logo": f"{SITE}/logo-mark.png", "image": OG,
                   "email": "info@philad.org", "sameAs": SOCIAL,
                   "address": {"@type": "PostalAddress", "streetAddress": "вул. Голосіївська, 57", "addressLocality": "Київ", "addressCountry": "UA"}})
        ld.append({"@context": "https://schema.org", "@type": "WebSite", "name": ORG, "url": SITE + "/", "inLanguage": "uk"})
    else:
        crumbs = [("Головна", SITE + "/")] + ([(CRUMB[f][1], url_of(CRUMB[f][0]))] if CRUMB.get(f) else []) + [(name, u)]
        ld.append({"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "url": u, "inLanguage": "uk", "isPartOf": {"@type": "WebSite", "name": ORG, "url": SITE + "/"}})
        ld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": x} for i, (n, x) in enumerate(crumbs)]})
    m = [f'<meta name="description" content="{esc(desc)}">', f'<link rel="canonical" href="{esc(u)}">', '<meta name="robots" content="index,follow,max-image-preview:large">',
         '<meta property="og:type" content="website">', '<meta property="og:locale" content="uk_UA">', f'<meta property="og:site_name" content="{ORG}">',
         f'<meta property="og:title" content="{esc(title)}">', f'<meta property="og:description" content="{esc(desc)}">', f'<meta property="og:url" content="{esc(u)}">',
         f'<meta property="og:image" content="{OG}">', '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
         '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{esc(title)}">', f'<meta name="twitter:description" content="{esc(desc)}">', f'<meta name="twitter:image" content="{OG}">']
    return "<!-- seo:start -->\n" + "\n".join(m) + "\n" + "\n".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld) + "\n<!-- seo:end -->"

def apply(f, title, desc):
    p = ROOT / f; s = p.read_text("utf-8")
    s = re.sub(r"<!-- seo:start -->.*?<!-- seo:end -->\n?", "", s, flags=re.S)
    head_end = s.find("</head>")
    if head_end < 0: head_end = s.index("<style")        # головна без </head>: шапкою вважаємо все до першого <style>
    head, rest = s[:head_end], s[head_end:]
    head = re.sub(r'<meta (?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*|article:[^"]*)"[^>]*>\n?', "", head)
    head = re.sub(r'<link rel="canonical"[^>]*>\n?', "", head)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", head, flags=re.S)
    head = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", head, count=1, flags=re.S)
    m = re.search(r'<meta name="claude:viewport-fit-sides"[^>]*>\n?', head) or re.search(r"<title>.*?</title>\n?", head, re.S)
    head = head[:m.end()] + ("\n" if not head[:m.end()].endswith("\n") else "") + block(f, title, desc) + "\n" + head[m.end():]
    p.write_text(head + rest, "utf-8")

def sitemaps():
    today = "2026-11-17"
    pri = {"index.html": "1.0", "blog.html": "0.8", "events.html": "0.8", "ministries.html": "0.8", "homegroups.html": "0.8", "first-visit.html": "0.9"}
    urls = "".join(f'<url><loc>{url_of(f)}</loc><lastmod>{today}</lastmod><priority>{pri.get(f, "0.6")}</priority></url>\n' for f in PAGES)
    (ROOT / "sitemap-pages.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n", "utf-8")
    idx = "".join(f"<sitemap><loc>{SITE}/{n}</loc><lastmod>{today}</lastmod></sitemap>\n" for n in ("sitemap-pages.xml", "sitemap-blog.xml", "sitemap-library.xml", "sitemap-homegroup-themes.xml", "sitemap-homegroups.xml") if (ROOT / n).exists())
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + idx + "</sitemapindex>\n", "utf-8")
    # у видачу не потрапляють чернетки й варіанти сторінок
    core = set(PAGES) | {"404.html"}
    drafts = sorted(f.name for f in ROOT.glob("*.html") if f.name not in core)
    dirs = [d.name for d in ROOT.iterdir() if d.is_dir() and d.name in ("min-v1-bak", "edits", "archive", "frames", "vendor")]
    rb = "User-agent: *\nAllow: /\n" + "".join(f"Disallow: /{n}\n" for n in drafts) + "".join(f"Disallow: /{d}/\n" for d in dirs) + f"\nSitemap: {SITE}/sitemap.xml\n"
    (ROOT / "robots.txt").write_text(rb, "utf-8")
    return len(drafts)

def redirects():
    """старі адреси philad.org → нові. Рядки з note=provisional — припущення, їх треба підтвердити."""
    old = json.load(open(ROOT.parent.parent / "research" / "old-sitemap.json"))
    rows = [("/pro-nas/", "/about.html", "exact"), ("/about-us/", "/about.html", "exact"), ("/vitaemo-na-saiti/", "/about.html", "exact"),
            ("/grafik-sluzheniy/", "/events.html", "exact"), ("/contacts/", "/contacts.html", "exact"), ("/online-translyaciya/", "/live.html", "exact"),
            ("/donate/", "/donate.html", "exact"), ("/dobrovilni-pozhertvuvannya/", "/donate.html", "exact"),
            ("/poshuk-boga/", "/seek-god.html", "exact"), ("/tut-zavzhdi-tobi-radi/", "/seek-god.html", "exact"),
            ("/sluzhinnya/", "/ministries.html", "exact"), ("/domashnie-gruppy/", "/homegroups.html", "exact"),
            ("/zavhdi_molytysya_i_ne_zanepadaty_duhom/", "/homegroup-themes.html", "exact"), ("/category/homegroups_themes/", "/homegroup-themes.html", "exact"),
            ("/cobytiya/", "/events.html", "exact"), ("/category/sermon/", "/sermons.html", "exact"), ("/category/sermon-old/", "/sermons.html", "exact"),
            ("/category/vse_zapisi/", "/blog.html", "exact"), ("/category/vse_zapisi/stati/", "/blog.html#tab=stati", "exact"), ("/category/blog/svidoctva/", "/blog.html#tab=svid", "exact"),
            ("/category/videoblogi/", "/blog.html#tab=vlog", "exact"), ("/videos/interview-vlogs/", "/blog.html#tab=iv", "exact"), ("/category/blog/", "/blog.html", "exact"),
            ("/cartoons/", "/", "provisional"), ("/video/", "/videos.html", "exact"), ("/events/", "/events-archive.html", "exact"), ("/cerkva-online/", "/live.html", "provisional")]
    post = {}
    js = (ROOT / "blog" / "data.js").read_text("utf-8")
    for l in js.split("posts:[")[1].splitlines():
        if l.strip().startswith("{"):
            r = json.loads(l.strip().rstrip(",")); post[urllib.parse.urlparse(r["href"]).path] = "/" + r["page"]
    rows += [(k, v, "exact") for k, v in post.items()]
    mins = set(re.findall(r'\bid:\s*"([^"]+)"', (ROOT / "min" / "data.js").read_text("utf-8")))
    for sec, pat in (("portfolio_item", "project"), ):
        for u in old.get(f"https://philad.org/{sec}-sitemap.xml", []):
            p = urllib.parse.urlparse(u).path; slug = p.strip("/").split("/")[-1]
            rows.append((p, "/ministries.html", "provisional"))
    for u in old.get("https://philad.org/home_groups_item-sitemap.xml", []) + old.get("https://philad.org/home_groups-sitemap.xml", []):
        p = urllib.parse.urlparse(u).path; sl = p.strip("/").split("/")[-1]
        if (ROOT / "homegroups" / sl / "index.html").exists(): rows.append((p, f"/homegroups/{sl}/", "exact"))       # сторінка групи є (build-group-pages.py)
        else: rows.append((p, "/homegroups.html", "provisional"))
    here = lambda p: (ROOT / urllib.parse.unquote(p).strip("/") / "index.html").exists()      # така сама адреса вже є на новому сайті → редирект не потрібен
    for u in old.get("https://philad.org/events_item-sitemap.xml", []):
        p = urllib.parse.urlparse(u).path
        if not here(p): rows.append((p, "/events-archive.html", "provisional"))
    for u in old.get("https://philad.org/slider-sitemap.xml", []):
        rows.append((urllib.parse.urlparse(u).path, "/events-archive.html", "provisional"))
    for u in old.get("https://philad.org/post-sitemap1.xml", []) + old.get("https://philad.org/post-sitemap2.xml", []):
        p = urllib.parse.urlparse(u).path
        if p.startswith("/homegroups_themes/") or p in post: continue
        if p.startswith(("/sermon/", "/sermon-old/", "/nonprofits-activism/")): rows.append((p, "/sermons.html", "provisional"))
        else: rows.append((p, "/blog.html", "provisional"))
    FMT = {"video": "Проповідь", "education": "Навчання", "interview-vlogs": "Інтерв’ю", "people-blogs": "Історії людей", "music": "Музика"}
    for u in old.get("https://philad.org/video-sitemap.xml", []):
        p = urllib.parse.urlparse(u).path
        if not here(p): rows.append((p, "/videos.html", "provisional"))
    for u in old.get("https://philad.org/videos-sitemap.xml", []):
        p = urllib.parse.urlparse(u).path; k = p.strip("/").split("/")[-1]
        rows.append((p, "/videos.html" + ("?format=" + urllib.parse.quote(FMT[k]) if k in FMT else ""), "exact" if k in FMT else "provisional"))
    def norm_to(t):
        m = re.match(r"^/([\w-]+\.html)(.*)$", t)
        if m and m.group(1) in urlmap.CLEAN: return urlmap.url(m.group(1)) + m.group(2)
        return "/" if t.startswith("/index.html") else t
    rows = [(a, norm_to(b), n) for a, b, n in rows]
    seen, out = set(), []
    for a, b, n in rows:
        if a not in seen and a != b: seen.add(a); out.append((a, b, n))
    with open(ROOT / "redirects.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["from", "to", "note"]); w.writerows(out)
    return len(out), sum(1 for r in out if r[2] == "exact")

if __name__ == "__main__":
    for f, (t, d) in PAGES.items():
        apply(f, t, d)
    n = sitemaps()
    import subprocess; subprocess.run([sys.executable, str(pathlib.Path(__file__).parent / "build-urls.py")], check=True)   # копії сторінок за адресами старого сайту
    try: a, b = redirects()
    except FileNotFoundError: a = b = 0
    print(f"SEO застосовано до {len(PAGES)} сторінок; у robots.txt закрито {n} чернеток; редиректів: {a} (точних {b})")
