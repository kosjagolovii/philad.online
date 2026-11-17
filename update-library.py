#!/usr/bin/env python3
"""Відеобібліотека й архів подій: забирає зі старого сайту philad.org і складає дві бази.

  python3 update-library.py            # завантажує сторінки (повторний запуск бере кеш library/raw-*.json.gz)
  python3 update-library.py --refresh  # перекачати все заново

Результат:
  library/video.js   — window.PHILAD_VIDEOS  (797 відео: назва, дата, YouTube-id, опис, розділ)
  library/events.js  — window.PHILAD_EVENTS_ARCHIVE (175 подій 2014–2017: назва, дата, текст, фото)
Список адрес — з sitemap старого сайту (video-sitemap.xml, events_item-sitemap.xml). Сторінки для кожного запису
будує build-library-pages.py. Точкові правки — library/overrides.json: {"video/<slug>": {"hide": true, "title": "…"}}.
"""
import json, re, sys, gzip, html, time, pathlib, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent
LIB = ROOT / "library"; LIB.mkdir(exist_ok=True)
SITE = "https://philad.org"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}

def get(url, tries=4):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(urllib.parse.quote(url, safe=":/?&=%#,"), headers=UA), timeout=40).read().decode("utf-8", "ignore")
        except Exception:
            time.sleep(1.5 * (i + 1))
    return ""

def urls(sitemap):
    return [u for u in re.findall(r"<loc>([^<]+)</loc>", get(f"{SITE}/{sitemap}")) if u.rstrip("/").count("/") >= 4]

def fetch_all(kind, items, refresh):
    f = LIB / f"raw-{kind}.json.gz"
    cache = json.loads(gzip.decompress(f.read_bytes())) if f.exists() and not refresh else {}
    todo = [u for u in items if u not in cache]
    if todo:
        def one(u):
            h = get(u); time.sleep(0.15)
            m = re.search(r'<article[^>]*>.*?</article><!-- #post-## -->', h, re.S) or re.search(r"<article.*?</article>", h, re.S)
            t = re.search(r"<title>(.*?)</title>", h, re.S)       # назва зі <title> — запасна, якщо в записі немає заголовка
            return u, ((("<!--T:" + re.sub(r"\s+", " ", t.group(1)) + "-->") if t else "") + m.group(0) if m else "")
        with ThreadPoolExecutor(6) as ex:
            for n, (u, a) in enumerate(ex.map(one, todo), 1):
                if a: cache[u] = a
                if n % 100 == 0: print(f"  {kind}: {n}/{len(todo)}", flush=True)
        f.write_bytes(gzip.compress(json.dumps(cache, ensure_ascii=False).encode()))
    return cache

def clean(s):
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"<!--.*?-->", " ", s, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()

def fixq(s):
    return s.replace("“", "«").replace("”", "»").replace("\xa0", " ").replace("­", "")

def parse_video(u, a):
    t = re.search(r'<h1 class="entry-title">(.*?)</h1>', a, re.S)
    d = re.search(r'datetime="(\d{4}-\d{2}-\d{2})', a)
    yt = (re.search(r'data-video_id="([\w-]{11})"', a) or re.search(r"youtube(?:-nocookie)?\.com/(?:embed/|v/)([\w-]{11})", a) or re.search(r"youtu\.be/([\w-]{11})", a))
    cat = re.search(r'\bvideos-([\w-]+)', a.split(">")[0])
    dur = re.search(r'itemprop="duration" content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"', a)
    body = re.search(r'<div class="entry-content">(.*?)</div><!-- \.entry-content -->', a, re.S)
    txt = ""
    if body:
        b = re.sub(r'<div class="yvii_single_video_player.*?</div>', " ", body.group(1), flags=re.S)
        b = re.sub(r'<span itemprop="video".*?</span>', " ", b, flags=re.S)
        b = re.sub(r"<iframe.*?</iframe>", " ", b, flags=re.S)
        txt = clean(b)
    sec = 0
    if dur: sec = int(dur.group(1) or 0) * 3600 + int(dur.group(2) or 0) * 60 + int(dur.group(3) or 0)
    title = fixq(clean(t.group(1))) if t else ""
    txt = fixq(txt)
    txt = re.sub(r"(?:https?://)?(?:www\.)?philad\.org/?", "", txt).strip(" ,.–-")
    if txt.lower() == title.lower(): txt = ""
    return {"slug": urllib.parse.unquote(u.rstrip("/").split("/")[-1]), "title": title, "date": d.group(1) if d else "", "yt": yt.group(1) if yt else "",
            "cat": cat.group(1) if cat else "video", "text": txt, "sec": sec}

def parse_event(u, a):
    t = re.search(r'<h1 class="entry-title">(.*?)</h1>', a, re.S)
    if not t:
        pt = re.search(r"<!--T:(.*?)-->", a)
        if pt:
            x = html.unescape(pt.group(1)).replace('Церква "Філадельфія"', "").replace("Страница не найдена", "").strip(" -–")
            t = re.match(r"(.*)", x) if x else None
    d = re.search(r'datetime="(\d{4}-\d{2}-\d{2})', a)
    cover = re.search(r"entry-cover-image\" style=\"background-image: url\('([^']+)'\)", a)
    body = re.search(r'<div class="entry-content">(.*?)</div><!-- \.entry-content -->', a, re.S)
    b = body.group(1) if body else ""
    yt = re.findall(r"youtube(?:-nocookie)?\.com/(?:embed/|v/)([\w-]{11})", b)
    title = fixq(clean(t.group(1))) if t else ""
    if not title:       # на старому сайті є події без назви — беремо початок тексту
        first = re.split(r"(?<=[.!?…])\s", clean(b), 1)[0].strip()
        title = fixq(first if len(first) <= 90 else first[:90].rsplit(" ", 1)[0] + "…")
    return {"slug": urllib.parse.unquote(u.rstrip("/").split("/")[-1]), "title": title, "date": d.group(1) if d else "",
            "cover": ("https:" + cover.group(1)) if cover and cover.group(1).startswith("//") else (cover.group(1) if cover else ""), "html": b, "yt": yt[0] if yt else ""}

def main():
    refresh = "--refresh" in sys.argv
    over = json.loads((LIB / "overrides.json").read_text("utf-8")) if (LIB / "overrides.json").exists() else {}
    vurls = urls("video-sitemap.xml"); vurls = [u for u in vurls if "/video/" in u and u.rstrip("/").split("/")[-1] != "video"]
    eurls = [u for u in urls("events_item-sitemap.xml") if "/events/" in u]
    print(len(vurls), "відео,", len(eurls), "подій у sitemap")
    V = fetch_all("video", vurls, refresh); E = fetch_all("events", eurls, refresh)
    videos = [parse_video(u, a) for u, a in V.items()]
    videos = [v for v in videos if v["title"] and v["yt"] and not over.get("video/" + v["slug"], {}).get("hide")]
    for v in videos: v.update({k: x for k, x in over.get("video/" + v["slug"], {}).items() if k != "hide"})
    videos.sort(key=lambda v: (v["date"], v["slug"]), reverse=True)
    events = [parse_event(u, a) for u, a in E.items()]
    events = [e for e in events if e["title"] and not over.get("events/" + e["slug"], {}).get("hide")]
    events.sort(key=lambda e: (e["date"], e["slug"]), reverse=True)
    (LIB / "parsed-video.json").write_text(json.dumps(videos, ensure_ascii=False), "utf-8")
    (LIB / "parsed-events.json").write_text(json.dumps(events, ensure_ascii=False), "utf-8")
    from collections import Counter
    print("відео:", len(videos), dict(Counter(v["cat"] for v in videos)), "| без YouTube відкинуто:", len(V) - len(videos))
    print("подій:", len(events), dict(Counter(e["date"][:4] for e in events)))

if __name__ == "__main__":
    main()
