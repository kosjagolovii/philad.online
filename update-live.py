#!/usr/bin/env python3
"""Сторінка «LIVE трансляція»: знаходить останню трансляцію каналу youtube.com/@philadkyiv/streams
(без ключа API) і записує її в live/latest.json + live/poster.jpg.

  live.json:  {"id","title","startedAt","endedAt","isLive","thumb"}
  id/title/…  — остання ЗАВЕРШЕНА трансляція (її сторінка показує, коли зараз ефіру немає);
  isLive      — чи йде трансляція просто зараз (liveId — її відео).
Сама сторінка перевіряє ефір у реальному часі через вбудований плеєр каналу, тож цей файл потрібен
для запасного відео. Запускати за розкладом (cron) на сервері сайту, наприклад щоп'ятнадцять хвилин:
    python3 update-live.py
"""
import json, re, urllib.request, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
HANDLE = "@philadkyiv"
H = {"User-Agent": "Mozilla/5.0", "Accept-Language": "uk-UA,uk;q=0.9"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=30).read()

def details(vid):
    """Назва та час початку/кінця ефіру зі сторінки відео."""
    h = get(f"https://www.youtube.com/watch?v={vid}").decode("utf-8", "ignore")
    d = re.search(r'"liveBroadcastDetails":(\{[^{}]*\})', h)
    d = json.loads(d.group(1)) if d else {}
    t = re.search(r'<meta name="title" content="([^"]+)"', h)
    return {
        "id": vid,
        "title": re.sub(r"&quot;", '"', t.group(1)) if t else "Трансляція",
        "startedAt": d.get("startTimestamp"),
        "endedAt": d.get("endTimestamp"),
        "isLive": bool(d.get("isLiveNow")),
    }

def stream_ids():
    page = get(f"https://www.youtube.com/{HANDLE}/streams").decode("utf-8", "ignore")
    seen = []
    for vid in re.findall(r'"contentId":"([\w-]{11})"', page) or re.findall(r'"videoId":"([\w-]{11})"', page):
        if vid not in seen:
            seen.append(vid)
    return seen

def main():
    ids = stream_ids()
    if not ids:
        print("live: на каналі не знайдено трансляцій; нічого не змінено"); return
    live_id, latest = None, None
    for vid in ids[:6]:
        d = details(vid)
        if d["isLive"] and not live_id:
            live_id = vid
        if d["endedAt"] and not d["isLive"]:
            latest = d; break
    if not latest:
        print("live: серед останніх трансляцій немає завершених; нічого не змінено"); return
    out = ROOT / "live"; out.mkdir(exist_ok=True)
    for name in ("maxresdefault", "sddefault", "hqdefault"):
        try:
            img = get(f"https://i.ytimg.com/vi/{latest['id']}/{name}.jpg")
            if len(img) > 5000:
                (out / "poster.jpg").write_bytes(img); break
        except Exception:
            continue
    latest["isLive"] = bool(live_id)
    latest["liveId"] = live_id
    latest["thumb"] = f"live/poster.jpg?v={latest['id']}"
    (out / "latest.json").write_text(json.dumps(latest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("live:", "ЕФІР" if live_id else "без ефіру", "| остання завершена:", latest["title"], latest["startedAt"])

try:
    main()
except Exception as e:
    print("live: помилка:", e, file=sys.stderr); sys.exit(1)
