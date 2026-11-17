#!/usr/bin/env python3
"""Refresh the «newest video» blocks of the site from public YouTube feeds (no API key).

  b7/      — home page, block 7: newest video of the sermons playlist
  youth/   — youth.html, «Приєднуйтесь до обговорення»: newest video of the PhiladYouth sermons playlist
  youth/live.* — youth.html, the small card on the big photo: newest stream of youtube.com/@philadyouth/streams

For each source it writes <dir>/latest.json and <dir>/latest.jpg next to the pages.
Run it on a schedule (cron / CI) on the server that hosts the site:
    python3 update-latest.py
"""
import json, re, urllib.request, pathlib, html, sys

ROOT = pathlib.Path(__file__).resolve().parent
UA = {"User-Agent": "Mozilla/5.0"}
SOURCES = [
    # (folder, feed query, link suffix)
    ("b7", "playlist_id=PL7YZQRnSwed-FcOBb76LTVZFtCzs373gI", "&list=PL7YZQRnSwed-FcOBb76LTVZFtCzs373gI"),
    ("youth", "playlist_id=PLx81bY_mI1sMEqdfnPw2ILQB428BnYke5", "&list=PLx81bY_mI1sMEqdfnPw2ILQB428BnYke5"),   # PhiladYouth, проповіді
]

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()

def thumb(vid, path):
    for name in ("maxresdefault", "sddefault", "hqdefault"):  # best thumbnail that exists
        try:
            img = get(f"https://i.ytimg.com/vi/{vid}/{name}.jpg")
            if len(img) > 5000:
                path.write_bytes(img); return True
        except Exception:
            continue
    return False

def update_streams(folder, handle):
    """The newest broadcast of a channel: the first video on its /streams tab (feeds don't separate streams)."""
    page = get(f"https://www.youtube.com/{handle}/streams").decode("utf-8", "ignore")
    ids = re.findall(r'"videoId":"([\w-]{11})"', page)
    if not ids:
        print(folder, ": no streams found; nothing changed"); return
    vid = ids[0]
    out = ROOT / folder
    out.mkdir(exist_ok=True)
    if not thumb(vid, out / "live.jpg"):
        print(folder, ": no stream thumbnail; nothing changed"); return
    try:
        title = json.loads(get(f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"))["title"]
    except Exception:
        title = "Трансляція"
    v = {"id": vid, "title": title, "url": f"https://www.youtube.com/watch?v={vid}", "thumb": f"{folder}/live.jpg?v={vid}"}
    (out / "live.json").write_text(json.dumps(v, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(folder, ": live:", title)

def update(folder, query, suffix):
    feed = get(f"https://www.youtube.com/feeds/videos.xml?{query}").decode("utf-8")
    entries = []
    for e in re.findall(r"<entry>(.*?)</entry>", feed, re.S):
        if "/shorts/" in e:                                  # Shorts are not «the newest video»
            continue
        f = lambda tag: html.unescape(re.search(rf"<{tag}>(.*?)</{tag}>", e, re.S).group(1).strip())
        entries.append({"id": f("yt:videoId"), "title": f("title"), "published": f("published")})
    if not entries:
        print(folder, ": feed has no videos; nothing changed"); return
    v = max(entries, key=lambda x: x["published"])          # newest by publish date
    out = ROOT / folder
    out.mkdir(exist_ok=True)
    for name in ("maxresdefault", "sddefault", "hqdefault"):  # best thumbnail that exists
        try:
            img = get(f"https://i.ytimg.com/vi/{v['id']}/{name}.jpg")
            if len(img) > 5000:
                (out / "latest.jpg").write_bytes(img); break
        except Exception:
            continue
    else:
        print(folder, ": no thumbnail could be downloaded; nothing changed"); return
    v["url"] = f"https://www.youtube.com/watch?v={v['id']}{suffix}"
    v["thumb"] = f"{folder}/latest.jpg?v={v['id']}"
    (out / "latest.json").write_text(json.dumps(v, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(folder, ": latest:", v["title"], v["published"])

for src in SOURCES:
    try:
        update(*src)
    except Exception as e:                                   # one broken feed must not stop the others
        print(src[0], ": failed:", e, file=sys.stderr)
try:
    update_streams("youth", "@philadyouth")
except Exception as e:
    print("youth live : failed:", e, file=sys.stderr)
