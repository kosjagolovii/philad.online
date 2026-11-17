#!/usr/bin/env python3
"""Сторінка «Проповіді»: збирає відео плейлиста церкви й автоматично розмічає їх фільтрами.

  Плейлист:  https://www.youtube.com/playlist?list=PL7YZQRnSwed-FcOBb76LTVZFtCzs373gI
  Результат: sermons/data.json  (його читає сторінка sermons.html)

Що робить для кожної проповіді:
  • з назви «Назва | Спікер | Формат» бере спікера та формат (зустріч, семінар…);
  • з дати публікації рахує рік і місяць, з тривалості — «до 20 хв / 20–30 / …»;
  • за словами в назві ставить теми (правила — sermons/taxonomy.json);
  • нову проповідь одразу видно у фільтрах, нового спікера — теж (список спікерів будується з даних).
Точкові виправлення окремого відео — у sermons/overrides.json.

Звідки беруться відео (без ключа API — лише публічні сторінки YouTube):
  1) сторінка плейлиста — 100 найновіших (цього досить, щоб підхопити нові проповіді щодня);
  2) RSS-стрічка плейлиста — точні дати для найновіших.
Старіші відео, які вже є в data.json, зберігаються. ПОВНУ історію (усі ~590 відео) можна підтягнути один раз
з офіційного API, якщо задати ключ:   YOUTUBE_API_KEY=… python3 update-sermons.py
Запускати за розкладом (cron), наприклад раз на добу:   python3 update-sermons.py
"""
import json, os, re, sys, time, html, pathlib, urllib.request, urllib.parse
from datetime import datetime, timezone, timedelta

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "sermons"
PLAYLIST = "PL7YZQRnSwed-FcOBb76LTVZFtCzs373gI"
UA = {"User-Agent": "Mozilla/5.0", "Accept-Language": "uk-UA,uk;q=0.9"}
KYIV = timezone(timedelta(hours=2))      # для дат достатньо; різниця з літнім часом на день не впливає

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode("utf-8", "ignore")

def load(name, default):
    p = OUT / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default

# ---------------- джерела ----------------
def dur_to_sec(s):
    if not s: return None
    parts = [int(x) for x in s.split(":")]
    sec = 0
    for x in parts: sec = sec * 60 + x
    return sec

def from_playlist_page():
    h = get(f"https://www.youtube.com/playlist?list={PLAYLIST}")
    d = json.loads(re.search(r"var ytInitialData = (\{.*?\});</script>", h, re.S).group(1))
    out = []
    def walk(o):
        if isinstance(o, dict):
            if "lockupViewModel" in o:
                x = o["lockupViewModel"]; md = x["metadata"]["lockupMetadataViewModel"]; dur = None
                for ov in x["contentImage"]["thumbnailViewModel"].get("overlays", []):
                    for b in ov.get("thumbnailBottomOverlayViewModel", {}).get("badges", []):
                        dur = b["thumbnailBadgeViewModel"].get("text")
                out.append({"id": x["contentId"], "title": md["title"]["content"], "sec": dur_to_sec(dur)})
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(d)
    return out

def from_rss():
    feed = get(f"https://www.youtube.com/feeds/videos.xml?playlist_id={PLAYLIST}")
    res = {}
    for e in re.findall(r"<entry>(.*?)</entry>", feed, re.S):
        vid = re.search(r"<yt:videoId>(.*?)</yt:videoId>", e).group(1)
        res[vid] = re.search(r"<published>(.*?)</published>", e).group(1)
    return res

def from_api(key):
    items, tok = [], None
    while True:
        q = {"part": "snippet,contentDetails", "playlistId": PLAYLIST, "maxResults": 50, "key": key}
        if tok: q["pageToken"] = tok
        r = json.loads(get("https://www.googleapis.com/youtube/v3/playlistItems?" + urllib.parse.urlencode(q)))
        for it in r["items"]:
            items.append({"id": it["contentDetails"]["videoId"], "title": it["snippet"]["title"],
                          "date": it["contentDetails"].get("videoPublishedAt")})
        tok = r.get("nextPageToken")
        if not tok: break
    for i in range(0, len(items), 50):          # тривалості
        ids = ",".join(x["id"] for x in items[i:i+50])
        r = json.loads(get("https://www.googleapis.com/youtube/v3/videos?" + urllib.parse.urlencode({"part": "contentDetails", "id": ids, "key": key})))
        dd = {v["id"]: v["contentDetails"]["duration"] for v in r["items"]}
        for x in items[i:i+50]:
            m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", dd.get(x["id"], ""))
            x["sec"] = (int(m.group(1) or 0) * 3600 + int(m.group(2) or 0) * 60 + int(m.group(3) or 0)) if m else None
    return items

def watch_date(vid):
    """Дата публікації зі сторінки відео (для тих, кого немає в RSS)."""
    h = get(f"https://www.youtube.com/watch?v={vid}")
    m = re.search(r'"publishDate":"([^"]+)"', h)
    return m.group(1) if m else None

# ---------------- розмітка ----------------
def parse_title(raw, tx):
    t = html.unescape(raw).strip()
    parts = [p.strip() for p in t.split("|")]
    title, speaker, fmt = t, None, tx["formats"]["default"]
    if len(parts) >= 3:
        title, speaker, fmt = " | ".join(parts[:-2]).strip(), parts[-2], parts[-1]
    elif len(parts) == 2:
        title, speaker = parts
    speaker = re.sub(r"\s+", " ", speaker or "").strip() or None
    speaker = tx["speakers"]["aliases"].get(speaker, speaker)
    title = re.sub(r"\s+", " ", title).strip()
    return title, speaker, fmt

def tag_topics(title, tx):
    low = title.lower()
    ids = [t["id"] for t in tx["topics"] if any(re.search(p, low) for p in t["match"])]
    return ids or [tx["fallback_topic"]["id"]]

def duration_bucket(sec, tx):
    if not sec: return None
    for b in tx["durations"]:
        if b["max"] is None or sec < b["max"]: return b["id"]

def to_date(s):
    if not s: return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(KYIV).date().isoformat()
    except Exception:
        return s[:10]

def main():
    tx = load("taxonomy.json", None)
    ov = load("overrides.json", {})
    old = {x["id"]: x for x in load("data.json", {"items": []})["items"]}
    key = os.environ.get("YOUTUBE_API_KEY")
    if key:
        src = from_api(key); print("API:", len(src), "відео")
    else:
        src = from_playlist_page(); print("сторінка плейлиста:", len(src), "відео")
    rss = {} if key else {}
    try:
        rss = from_rss()
    except Exception as e:
        print("RSS недоступний:", e, file=sys.stderr)
    items = dict(old)
    new = 0
    for s in src:
        vid = s["id"]
        prev = items.get(vid, {})
        date = to_date(s.get("date") or rss.get(vid)) or prev.get("date")
        if not date:
            try:
                date = to_date(watch_date(vid)); time.sleep(0.25)
            except Exception as e:
                print("немає дати:", vid, e, file=sys.stderr)
        title, speaker, fmt = parse_title(s["title"], tx)
        o = ov.get(vid, {})
        sec = s.get("sec") or prev.get("sec")
        rec = {"id": vid, "title": o.get("title", title), "speaker": o.get("speaker", speaker) or "Невідомий спікер",
               "format": o.get("format", fmt), "date": date, "sec": sec,
               "dur": duration_bucket(sec, tx), "topics": o.get("topics") or tag_topics(o.get("title", title), tx)}
        if o.get("hide"): rec["hide"] = True
        if vid not in items: new += 1
        items[vid] = rec
    for vid in list(items):                       # відео, прибрані з плейлиста, — не показуємо, якщо ми бачили повний список
        if key and vid not in {s["id"] for s in src}: del items[vid]
    lst = sorted((x for x in items.values() if not x.get("hide") and x.get("date")), key=lambda x: x["date"], reverse=True)
    data = {"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "playlist": PLAYLIST,
            "topics": [{"id": t["id"], "label": t["label"]} for t in tx["topics"]] + [tx["fallback_topic"]],
            "durations": [{"id": b["id"], "label": b["label"]} for b in tx["durations"]],
            "avatars": tx["avatars"], "items": lst}
    OUT.mkdir(exist_ok=True)
    (OUT / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # те саме як скрипт: так сторінка працює і без сервера (відкрита просто як файл)
    (OUT / "data.js").write_text("window.SERMONS_DATA=" + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"готово: {len(lst)} проповідей, нових {new}")

try:
    main()
except Exception as e:
    print("sermons: помилка:", e, file=sys.stderr); sys.exit(1)
