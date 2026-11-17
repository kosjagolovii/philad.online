"""Збирає hgthemes/data.json з кешу тем: приводить мітки до словника, додає релевантні мітки темам без них."""
import json, re, pathlib, collections
from datetime import datetime, timezone

BOOKS = ["Буття","Вихід","Левит","Числа","Повторення Закону","Ісус Навин","Суддів","Рут","1 Самуїла","2 Самуїла","1 Царів","2 Царів","1 Хронік","2 Хронік","Ездри","Неемії","Естер","Йова","Псалми","Приповідки","Екклезіяст","Пісня Над Піснями","Ісаї","Єремії","Плач Єремії","Єзекіїля","Даниїла","Осії","Йоїла","Амоса","Овдія","Йони","Михея","Наума","Авакума","Софонії","Огія","Захарії","Малахії",
         "Матвія","Марка","Луки","Івана","Дії","Римлян","1 Коринтян","2 Коринтян","Галатів","Ефесян","Филип’ян","Колосян","1 Солунян","2 Солунян","1 Тимофія","2 Тимофія","Тита","Филимона","Євреїв","Якова","1 Петра","2 Петра","1 Івана","2 Івана","3 Івана","Юди","Одкровення"]
NT = BOOKS.index("Матвія")
ALIAS = {"Филип": "Филип’ян", "Филипʼян": "Филип’ян", "Филимона": "Филимона", "Об": "Одкровення", "Об'явлення": "Одкровення", "Об’явлення": "Одкровення",
         "Ісуса Навина": "Ісус Навин", "Ісус Навина": "Ісус Навин", "Числ": "Числа", "Ездр": "Ездри", "Хронік": "Хронік"}

def canon_book(raw):
    r = re.sub(r"\s+", " ", raw.strip())
    m = re.match(r"([123])\s*(.*)", r)
    num, name = (m.group(1) + " ", m.group(2)) if m else ("", r)
    name = ALIAS.get(name, name)
    for stem in ("Псалм", "Приповід", "Екклезіяст", "Пісн", "Дії"):
        if name.startswith(stem):
            name = {"Псалм": "Псалми", "Приповід": "Приповідки", "Екклезіяст": "Екклезіяст", "Пісн": "Пісня Над Піснями", "Дії": "Дії"}[stem]
    if name.startswith("Филип") and not name.startswith("Филим"): name = "Филип’ян"
    for b in BOOKS:
        if b == num + name: return b
    for b in BOOKS:                                     # допускаємо відмінкові закінчення
        if (num + name)[:max(4, len(num) + 3)] == b[:max(4, len(num) + 3)] and b.startswith(num): return b
    return None

def tidy(t):
    """прибирає зайві пробіли перед розділовими знаками та всередині лапок (лишаються від HTML-тегів)"""
    t = re.sub(r"\s+([,.;:!?»”’)\]])", r"\1", t)
    return re.sub(r"([«“(\[„])\s+", r"\1", t)

def build(cache, out):
    out = pathlib.Path(out)
    tx = json.loads((out / "tags.json").read_text(encoding="utf-8"))
    canon = {t["id"]: t for t in tx["tags"]}
    items, book_cnt = [], collections.Counter()
    labels = {t["id"]: t["label"].lower() for t in tx["tags"]}
    def to_canon(raw):
        """Мітка з сайту → мітка зі словника. Фрази й одноразові мітки без відповідника відкидаємо."""
        r = raw.strip().lstrip("#").lower().replace("_", " ").strip()
        if r in ("невоцерковлені гості", "невоцерковлені_гості"): return "guests"
        i = r.replace(" ", "_")
        if i in canon: return i
        if len(r.split()) <= 3:                                  # «Любов Божа» → Любов, «віра Божа» → Віра
            for tid, lab in labels.items():
                if tid != "guests" and re.search(r"(?<![а-яіїєґ])" + re.escape(lab) + r"(?![а-яіїєґ])", r): return tid
        return None
    for r in cache.values():
        ids, auto = [], False
        for raw in r["tags"]:
            i = to_canon(raw)
            if i and i not in ids: ids.append(i)
        topical = [i for i in ids if i != "guests"]
        if not topical:                                  # тема без (відповідних) міток → підбираємо за назвою й текстом
            title, text = r["title"].lower(), r.get("text", "").lower()
            sc = []
            for t in tx["tags"]:
                th = sum(len(re.findall(p_, title)) for p_ in t["match"])
                xh = sum(len(re.findall(p_, text)) for p_ in t["match"])
                gen = t.get("generic")
                # назва — найсильніший сигнал; у тексті загальні мітки (Віра, Слово Боже…) потребують більше збігів
                if th or xh >= (5 if gen else 3):
                    sc.append((5 * th + min(xh, 8) * (0.5 if gen else 1), t["id"]))
            sc.sort(reverse=True)
            pick = [i for s_, i in sc[:3]]
            ids += pick
            auto = bool(pick)
        refs = []
        for b in r.get("refs", []):
            c = canon_book(b)
            if c and c not in refs: refs.append(c)
        for b in refs: book_cnt[b] += 1
        import urllib.parse
        slug = urllib.parse.unquote(r["url"].rstrip("/").split("/")[-1]).replace("\ufeff", "")
        d_ = r.get("doc") or {}
        body_ = " ".join(b.get("text", "") for k in ("recap", "intro", "conclusion", "challenge", "rest") for b in d_.get(k, []))
        body_ += " ".join(b.get("text", "") for p_ in d_.get("points", []) for b in p_["blocks"])
        body_ += " " + r["title"] + " " + (r.get("excerpt", "") or "")
        ru_, uk_ = len(re.findall(r"[ыэъЫЭЪ]", body_)), len(re.findall(r"[іїєґІЇЄҐ]", body_))
        lang = "ru" if ru_ > 8 and ru_ > uk_ * 0.6 else "uk"
        items.append({"url": r["url"], "page": f"homegroups_themes/{slug}/", "title": r["title"], "date": r["date"] or "2000-01-01", "tags": ids, "auto": auto,
                      "refs": refs, "lang": lang, "q": r.get("q", 0), "img": r.get("img"), "excerpt": tidy(r.get("excerpt", "")), "text": tidy((r.get("text", "") or "")[:1800])})
    # теми без власної ілюстрації беруть ілюстрацію іншої теми з тією ж міткою (стабільно, за назвою)
    import zlib
    pool = collections.defaultdict(list)
    for i in items:
        if i["img"]:
            for t in i["tags"]: pool[t].append(i["img"])
    allimg = sorted({i["img"] for i in items if i["img"]})
    for i in items:
        if not i["img"]:
            k = zlib.crc32(i["title"].encode())
            for t in i["tags"]:
                if t != "guests" and pool[t]:
                    i["img"] = sorted(set(pool[t]))[k % len(set(pool[t]))]; break
            else:
                i["img"] = allimg[k % len(allimg)] if allimg else None
    cnt = collections.Counter(t for i in items for t in i["tags"])
    tags = [{"id": t["id"], "label": t["label"], "group": t["group"]} for t in tx["tags"] if cnt[t["id"]]]
    groups = tx["groups"]
    books = [{"id": b, "label": b, "testament": "nt" if BOOKS.index(b) >= NT else "ot"} for b in BOOKS if book_cnt[b]]
    items.sort(key=lambda x: x["date"], reverse=True)
    data = {"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "groups": groups, "tags": tags, "books": books, "items": items}
    (out / "data.json").write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")
    (out / "data.js").write_text("window.HGTHEMES_DATA=" + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
    auto_n = sum(1 for i in items if i["auto"]); nt = sum(1 for i in items if not [t for t in i["tags"] if t != "guests"])
    print(f"готово: {len(items)} тем; міток у фільтрі: {len(tags)}; тем із доданими мітками: {auto_n}; без жодної мітки: {nt}; книг Біблії: {len(books)}")
