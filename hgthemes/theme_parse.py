"""Розбір тексту теми домашньої групи (HTML зі старого сайту) на структурні блоки.

Старий сайт позначає частини емодзі: 🔙 підсумки минулої теми, 📌 висновок, 💪 виклик, ❓ питання, 📖 вірш,
📌💭 роздум, ☝ підказка. Новіші теми так і написані; у старіших емодзі немає — тоді блоки лишаються просто
заголовками й абзацами, і шаблон показує їх у тому ж порядку.

parse_theme_body(html) -> {"blocks": [{"t": тип, "text": ..., "ref": ...}], "sections": [...]}
  типи блоків: h (заголовок, "lvl": 2/3), p (абзац), q (питання), v (вірш: ref + text), hint (підказка), li (пункт списку)
  sections — те саме, згруповане: recap, intro, points[{title, blocks}], conclusion, challenge, rest
"""
import re, html
from html.parser import HTMLParser

EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐️‍]")
REF = re.compile(r"^((?:[123]\s*)?[А-ЯІЇЄҐA-Z][А-Яа-яІіЇїЄєҐґ’'ʼ\.]+(?:\s+[А-Яа-яІіЇїЄєҐґ’'ʼ]+){0,2})\s*(\d+\s*[:,]\s*\d+(?:\s*[–\-—,]\s*\d+)*)\s*[:\.]?\s*(.*)$", re.S)

STATS = {}
def _n(k, c=1): STATS[k] = STATS.get(k, 0) + c

TAG = re.compile(r"(<[^>]+>)")
LETTER = "А-Яа-яІіЇїЄєҐґA-Za-z"
YT = re.compile(r"(?:youtube(?:-nocookie)?\.com/embed/|youtu\.be/)([\w-]{6,})")

def _quotes(seg, st):
    """Єдині лапки: «…», у вкладених — „…“. st = {"prev": попередній символ, "depth": рівень}."""
    out = []
    for ch in seg:
        if ch in '"“”„«»':
            ctx = st["prev"] in ("", " ", "(", "[", "—", "–", "-", "/", "«", "„", "“", ":")
            if ch in "«„": op = True
            elif ch == "»": op = False
            elif ch == "”": op = st["depth"] == 0 and ctx
            else: op = not (st["depth"] > 0 and not ctx)
            if op:
                out.append("«" if st["depth"] == 0 else "„"); st["depth"] += 1
            else:
                if st["depth"] > 0: st["depth"] -= 1
                out.append("»" if st["depth"] == 0 else "“")
            if ch != out[-1]: _n("лапки")
            st["prev"] = out[-1]
        else:
            out.append(ch); st["prev"] = ch
    return "".join(out)

L2C = dict(zip("ABCEHIKMOPTXaceiopxy", "АВСЕНІКМОРТХасеіорху"))
C2L = {v: k for k, v in L2C.items()}
def _homoglyphs(seg):
    """Слова, де латинські літери підмішані до кирилиці (Iвана, Екклезiяст) — вирівнюємо за переважним алфавітом."""
    def fix(m):
        w = m.group(0)
        cyr = len(re.findall(r"[А-Яа-яІіЇїЄєҐґ]", w)); lat = len(re.findall(r"[A-Za-z]", w))
        if not cyr or not lat: return w
        _n("латиниця в кирилиці")
        return "".join(L2C.get(ch, ch) for ch in w) if cyr >= lat else "".join(C2L.get(ch, ch) for ch in w)
    return re.sub(r"[A-Za-zА-Яа-яІіЇїЄєҐґ’]+", fix, seg)

def clean(t):
    """Прибирає зайві пробіли/переноси й типові помилки набору; працює і з простим текстом, і з html із <b><i><a>."""
    t0 = t
    t = html.unescape(t) if "&" in t and "<" not in t else t
    t = t.replace("\xa0", " ").replace("​", "").replace("﻿", "").replace("­", "")
    t = re.sub(r"\s+", " ", t).strip()
    st = {"prev": "", "depth": 0}
    parts = TAG.split(t)
    parts = [x if x.startswith("<") and x.endswith(">") else _quotes(_homoglyphs(x), st) for x in parts]
    t = "".join(parts)
    # апострофи між літерами
    t = re.sub(r"(?<=[%s])['`ʼ’‘](?=[%s])" % (LETTER, LETTER), "’", t)
    # тире, слеші
    t = re.sub(r"\s[-–−]\s", " — ", t)
    t = re.sub(r"(?<=\w)\\(?=\w)", "/", t); t = re.sub(r"\\+$", "", t).strip()
    t = t.replace("...", "…")
    # пробіли навколо розділових знаків
    t = re.sub(r"\s+([,.;:!?…»“)\]])", r"\1", t)
    t = re.sub(r"([«„(\[])\s+", r"\1", t)
    t = re.sub(r"([,;:!?])\1+", r"\1", t)
    t = re.sub(r"(?<=[?!])(?=[А-ЯІЇЄҐ])", " ", t)
    t = re.sub(r"(?<=[а-яіїєґ>])\.\.(?!\.)", ".", t)
    t = re.sub(r"(?<=[а-яіїєґ’>])([,;])(?=[А-Яа-яІіЇїЄєҐґ])", r"\1 ", t)
    t = re.sub(r"(?<=[а-яіїєґ’])([.!?:])(?=[А-ЯІЇЄҐ])", r"\1 ", t)
    t = re.sub(r"^(\d{1,2})\.(?=[%s])" % LETTER, r"\1. ", t)
    # порожні й злиті теги
    for tg in ("b", "i"):
        t = re.sub(r"<%s>\s*</%s>" % (tg, tg), "", t)
        t = re.sub(r"</%s>(\s*)<%s>" % (tg, tg), r"\1", t)
        t = re.sub(r"<%s>(\s+)" % tg, r"\1<%s>" % tg, t)
        t = re.sub(r"(\s+)</%s>" % tg, r"</%s>\1" % tg, t)
    t = re.sub(r"\s+", " ", t).strip()
    if "«" not in t and "„" in t: t = t.replace("„", "«").replace("“", "»")
    if t != t0: _n("виправлено рядків")
    return t

def fix_edges(t):
    """Зайва відкривна лапка на початку / закривна в кінці (в оригіналах їх часто плутають)."""
    op = t.count("«") + t.count("„"); cl = t.count("»") + t.count("“")
    while op > cl and t[:1] in "«„": t = t[1:].lstrip(); op -= 1
    while cl > op and t[-1:] in "»“": t = t[:-1].rstrip(); cl -= 1
    if "«" not in t and "„" in t: t = t.replace("„", "«").replace("“", "»")
    return t

def tidy(t):
    return clean(t)

def unwrap_style(h):
    """Якщо весь блок у <b> чи <i> — це оформлення оригіналу (вірші курсивом, питання жирним), а не акцент: знімаємо."""
    for tg in ("b", "i"):
        while True:
            m = re.match(r"^<%s>(.*)</%s>$" % (tg, tg), h, re.S)
            if m and m.group(1).count("<%s>" % tg) == 0: h = m.group(1).strip(); _n("знято суцільне оформлення")
            else: break
    return h

def fmt_html(raw_html):
    h = EMOJI.sub("", raw_html)
    h = clean(h)
    h = re.sub(r"^[–—\-]\s*", "", h)
    h = unwrap_style(h)
    h = clean(h)
    return h if re.search(r"<(b|i|a)[ >]", h) else None

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks, self.cur, self.curh, self.tag = [], None, None, None
        self.pending, self.skip, self.stack = [], 0, []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "noscript", "audio"): self.skip += 1; return
        if self.skip: return
        if tag == "iframe":
            m = YT.search(a.get("src") or a.get("data-src") or "")
            if m: self.pending.append(("video", m.group(1), ""))
            else: _n("сторонній iframe пропущено")
            return
        if tag == "img":
            src = a.get("data-src") or a.get("data-lazy-src") or a.get("src") or ""
            cls = a.get("class", "") or ""
            try: w = int(a.get("width") or 0)
            except ValueError: w = 0
            if "emoji" in cls and self.cur is not None and a.get("alt"):
                self.cur.append(a["alt"]); self.curh.append(a["alt"]); return
            if src and "emoji" not in cls and "smiley" not in cls and not src.startswith("data:") and (w == 0 or w > 80):
                self.pending.append(("img", src, a.get("alt", "") or ""))
            return
        if tag in ("h1", "h2", "h3", "h4", "p", "li", "div"):
            self.flush(); self.cur, self.curh, self.tag = [], [], tag
        elif tag == "br" and self.cur is not None:
            t0 = self.tag; self.flush(); self.cur, self.curh, self.tag = [], [], t0   # <br> — це новий рядок/абзац оригіналу
        elif self.cur is not None:
            if tag in ("strong", "b"): self.curh.append("<b>"); self.stack.append(("b", True))
            elif tag in ("em", "i"):
                ok = "fa" not in (a.get("class") or "").split() and "fa-" not in (a.get("class") or "")
                if ok: self.curh.append("<i>")
                self.stack.append(("i", ok))
            elif tag == "a":
                href = (a.get("href") or "").strip()
                ok = bool(href) and not href.startswith("#") and not href.lower().startswith("javascript")
                if ok: self.curh.append('<a href="%s">' % html.escape(href, quote=True))
                self.stack.append(("a", ok))
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "audio"): self.skip = max(0, self.skip - 1); return
        if self.skip: return
        if tag in ("h1", "h2", "h3", "h4", "p", "li", "div"): self.flush(); return
        k = {"strong": "b", "b": "b", "em": "i", "i": "i", "a": "a"}.get(tag)
        if k and self.cur is not None:
            for n in range(len(self.stack) - 1, -1, -1):
                if self.stack[n][0] == k:
                    _, emitted = self.stack.pop(n)
                    if emitted: self.curh.append("</%s>" % k)
                    break
    def handle_data(self, d):
        if self.skip or self.cur is None: return
        self.cur.append(d); self.curh.append(html.escape(d, quote=False))
    def flush(self):
        if self.cur is not None:
            txt, htm = "".join(self.cur), "".join(self.curh)
            while self.stack:
                k, emitted = self.stack.pop()
                if emitted: htm += "</%s>" % k
            if clean(EMOJI.sub("", txt)): self.blocks.append((self.tag, txt, htm))
        self.cur, self.curh, self.tag = None, None, None
        for im in self.pending: self.blocks.append(im)
        self.pending = []

def lead_of(raw):
    r = raw.replace("\xa0", " ")
    m = re.search(r"[^\W_]", r)
    return "".join(EMOJI.findall(r[:m.start() if m else len(r)]))

def emo_extra(raw):
    """Де стояли смайлики в оригіналі: «emo» — на початку блоку, «etext» — якщо є ще й усередині тексту."""
    r = raw.replace("\xa0", " ")
    m = re.search(r"[^\W_]", r)
    pos = m.start() if m else len(r)
    lead = "".join(EMOJI.findall(r[:pos]))
    if EMOJI.search(r[pos:]):
        return {"etext": re.sub(r"^[–—\-]\s*", "", tidy(r))}
    return {"emo": lead} if lead else {}

def classify(tag, raw):
    emo = "".join(EMOJI.findall(raw))
    text = tidy(EMOJI.sub("", raw))
    text = re.sub(r"^[–—\-]\s*", "", text)
    return emo, fix_edges(text)

ABBR = {"гр", "ст", "напр", "див", "пор", "тощо", "т", "д", "п", "р", "рр", "св", "кн", "ін", "мт", "мр", "лк", "об", "дії", "прим", "вид", "ч", "с", "м", "пс", "пр", "кор", "кол", "єв", "рим"}
SENT = re.compile(r"(?<=[.!?…])(?:»)?\s+(?=[А-ЯІЇЄҐ«„(\[])")

def split_sentences(text):
    parts, last = [], 0
    for m in SENT.finditer(text):
        head = text[last:m.start() + (1 if text[m.start():m.start() + 1] == "»" else 0)]
        w = re.findall(r"([A-Za-zА-Яа-яІіЇїЄєҐґ]+)\.$", head)
        if w and w[-1].lower() in ABBR: continue
        if re.search(r"\d\.$", head) and re.search(r"(?:^|\s)\d+\.$", head): continue
        if head.count("«") + head.count("„") > head.count("»") + head.count("“"): continue   # не розриваємо цитату
        parts.append(head.strip()); last = m.end()
    parts.append(text[last:].strip())
    return [x for x in parts if x]

def split_long(text, limit=520, target=360):
    """Дуже довгий абзац → кілька абзаців по 2–4 речення."""
    if len(text) <= limit: return [text]
    sents = split_sentences(text)
    if len(sents) < 3: return [text]
    out, cur = [], ""
    for s_ in sents:
        if cur and len(cur) + len(s_) + 1 > target and len(cur) >= 120: out.append(cur); cur = s_
        else: cur = (cur + " " + s_).strip()
    if cur:
        if out and len(cur) < 90: out[-1] += " " + cur
        else: out.append(cur)
    if len(out) > 1: _n("довгий абзац розбито")
    return out

def split_questions(text):
    """«Питання? — Інше питання? Пояснення.» → [питання, питання, решта-абзац]"""
    segs = [x.strip() for x in re.split(r"(?<=\?)\s+(?:[–—-]\s*)?(?=[А-ЯІЇЄҐ«„(])", text) if x.strip()]
    qs, rest = [], ""
    for i, x in enumerate(segs):
        if x.endswith("?") and not rest: qs.append(re.sub(r"^[–—-]\s*", "", x))
        else: rest = (rest + " " + x).strip()
    if not qs: return [text], ""
    return qs, rest

TAGRE = re.compile(r"<(/?)(b|i|a)((?:\s[^>]*)?)>")
def split_long_html(h, limit=520, target=360):
    """Те саме для абзаців із <b><i><a>: розбиваємо за реченнями й дозакриваємо/перевідкриваємо теги на межах."""
    plain = html.unescape(re.sub(r"<[^>]+>", "", h))
    if len(plain) <= limit: return [h]
    pat = re.compile(r"(?<=[.!?…])(?:»)?(?:</[bia]>)*\s+(?=(?:<[^>]+>)*[А-ЯІЇЄҐ«„(\[])")
    cuts, last, sents = [], 0, []
    for m in pat.finditer(h):
        head = h[last:m.start()]
        hp = re.sub(r"<[^>]+>", "", head)
        w = re.findall(r"([A-Za-zА-Яа-яІіЇїЄєҐґ]+)\.$", hp)
        if (w and w[-1].lower() in ABBR) or re.search(r"(?:^|\s)\d+\.$", hp): continue
        if hp.count("«") + hp.count("„") > hp.count("»") + hp.count("“"): continue
        sents.append(h[last:m.end()].strip()); last = m.end()
    sents.append(h[last:].strip())
    if len(sents) < 3: return [h]
    out, cur = [], ""
    for x in sents:
        if cur and len(re.sub(r"<[^>]+>", "", cur)) + len(re.sub(r"<[^>]+>", "", x)) > target and len(re.sub(r"<[^>]+>", "", cur)) >= 120: out.append(cur); cur = x
        else: cur = (cur + " " + x).strip()
    if cur: out.append(cur)
    stack, res = [], []
    for piece in out:
        pre = "".join("<%s%s>" % (n, a) for n, a in stack)
        for m in TAGRE.finditer(piece):
            if m.group(1) == "/":
                for k in range(len(stack) - 1, -1, -1):
                    if stack[k][0] == m.group(2): stack.pop(k); break
            else: stack.append((m.group(2), m.group(3)))
        post = "".join("</%s>" % n for n, a in reversed(stack))
        res.append(pre + piece + post)
    _n("довгий абзац розбито")
    return res

MARK = re.compile(r"(?<=[^\s❓💭📌💪\ufe0f])\s*(?=[❓💭📌💪])")

def parse_theme_body(body_html):
    p = P(); p.feed(body_html); p.flush()
    blocks = []
    expanded = []
    for blk in p.blocks:
        if blk[0] in ("img", "video") or not MARK.search(blk[1]): expanded.append(blk); continue
        pieces = [x for x in MARK.split(blk[1]) if x.strip()]
        _n("абзац розбито за позначками")
        expanded += [(blk[0], x, "") for x in pieces]
    for tag, raw, *extra in expanded:
        if tag == "img":
            blocks.append({"t": "img", "src": raw, "alt": extra[0] if extra else ""}); continue
        if tag == "video":
            blocks.append({"t": "video", "id": raw}); continue
        emo, text = classify(tag, raw)
        htm = fmt_html(extra[0]) if extra and extra[0] else None
        if tag in ("p", "li") and re.search(r"\S\s[⁃•●▪]\s", text):
            segs = [x.strip() for x in re.split(r"\s*[⁃•●▪]\s+", text)]
            if segs[0]: blocks.append({"t": "p", "text": segs[0], "idea": False})
            for x in segs[1:]:
                if x: blocks.append({"t": "bul", "text": x})
            _n("абзац із маркерами розбито на список")
            continue
        if tag in ("p", "li") and re.match(r"^[⁃•●▪·−]\s?\S", text):
            text = re.sub(r"^[⁃•●▪·−]\s?", "", text)
            if htm: htm = re.sub(r"^((?:<[^>]+>)*)[⁃•●▪·−]\s?", r"\1", htm)
            blocks.append({"t": "bul", "text": text, **({"html": htm} if htm else {})}); continue
        if not text: continue
        low = text.lower()
        if tag in ("h1", "h2", "h3", "h4") and "🔙" not in emo and not re.match(r"^(тема\s*[:“\"«]|минула тема|\d+[\.\)]\s|висновк|виклик)", low) and (len(text) > 80 or re.search(r"[.?!]$", text)):
            tag = "p"; _n("«заголовок» був абзацом")
        if tag in ("h1", "h2", "h3", "h4"):
            lvl = 2 if tag in ("h1", "h2") else 3
            kind = ("recap" if "🔙" in emo or "обговорення виклику" in low else
                    "conclusion" if re.match(r"^висновк|^висновок", low) else
                    "challenge" if re.match(r"^виклик", low) else
                    "theme" if re.match(r"^тема\s*[:“\"«]", low) else
                    "prev" if re.match(r"^минула тема", low) else
                    "point" if re.match(r"^\d+[\.\)]\s", text) else "h")
            blocks.append({"t": "h", "lvl": lvl, "kind": kind, "text": text.rstrip(":").strip(), **emo_extra(raw)})
        elif "❓" in emo or text.endswith("?") and "📖" not in lead_of(raw) and len(text) < 400 and ("❓" in raw) or (tag in ("p", "li", "div") and re.match(r"^\s*[–—-]\s*\S", raw.replace("\xa0", " ")) and text.endswith("?") and len(text) < 300):
            sents_ = split_sentences(text)
            if len(text) > 160 and len(sents_) > 1 and sents_[-1].endswith("?") and not any(x.endswith("?") for x in sents_[:-1]):
                for x in split_long(" ".join(sents_[:-1])): blocks.append({"t": "p", "text": x, "idea": False})
                blocks.append({"t": "q", "text": sents_[-1], **emo_extra(raw)} if "etext" not in emo_extra(raw) else {"t": "q", "text": sents_[-1], "emo": lead_of(raw)} if lead_of(raw) else {"t": "q", "text": sents_[-1]})
                _n("питання відокремлено від пояснення"); continue
            qs_, rest_ = split_questions(text)
            if len(qs_) == 1 and not rest_:
                blocks.append({"t": "q", "text": text, **({"html": htm} if htm else {}), **emo_extra(raw)})
            else:
                ex = emo_extra(raw)
                for k, q_ in enumerate(qs_): blocks.append({"t": "q", "text": q_, **(ex if k == 0 and "etext" not in ex else {})})
                if rest_: blocks.append({"t": "p", "text": rest_, "idea": False})
                _n("питання розділено")
        elif "📖" in lead_of(raw):
            m = REF.match(text)
            if m: blocks.append({"t": "v", "ref": re.sub(r"\s+", " ", f"{m.group(1)} {m.group(2)}").strip(), "text": fix_edges(m.group(3).strip(" ”“\"")), "emo": "".join(EMOJI.findall(raw))})
            else: blocks.append({"t": "v", "ref": "", "text": fix_edges(text.strip(" ”“\"")), "emo": "".join(EMOJI.findall(raw))})
        elif "☝" in emo or re.match(r"^\((.*)\)$", text) and "☝" in raw:
            blocks.append({"t": "hint", "text": text.strip("()"), "emo": "☝"})
        elif tag == "li":
            blocks.append({"t": "li", "text": text, **({"html": htm} if htm else {}), **emo_extra(raw)})
        else:
            if htm and len(text) > 520:
                hp_ = split_long_html(htm)
                if len(hp_) > 1:
                    for k, hx in enumerate(hp_):
                        tx = clean(re.sub(r"<[^>]+>", "", html.unescape(hx)))
                        hh = hx if re.search(r"<(b|i|a)[ >]", hx) else None
                        blk = {"t": "p", "text": tx, "idea": "💭" in emo and k == 0, **({"html": hh} if hh else {})}
                        if k == 0 and lead_of(raw): blk["emo"] = lead_of(raw)
                        blocks.append(blk)
                    continue
            parts_ = split_long(text) if not htm else [text]
            for k, x in enumerate(parts_):
                if k == 0: blocks.append({"t": "p", "text": x, "idea": "💭" in emo, **({"html": htm} if htm and len(parts_) == 1 else {}), **emo_extra(raw)} if len(parts_) == 1 else {"t": "p", "text": x, "idea": "💭" in emo, **({"emo": lead_of(raw)} if lead_of(raw) else {})})
                else: blocks.append({"t": "p", "text": x, "idea": False})
    return {"blocks": blocks, "sections": sectionize(blocks)}

def sectionize(blocks):
    """Групує блоки: recap → intro → points[] → conclusion → challenge (усе, що не підійшло, — у rest)."""
    S = {"emo": {}, "recap": [], "intro": [], "points": [], "conclusion": [], "challenge": [], "rest": [], "prev_title": "", "title": ""}
    mode, point, in_recap = "intro", None, False
    seen_theme = False
    for b in blocks:
        if b["t"] == "h":
            k = b["kind"]
            if k == "recap": mode, in_recap = "recap", True; S["emo"]["recap"] = b.get("emo", ""); continue
            if k == "theme": mode, in_recap = "intro", False; seen_theme = True; S["title"] = re.sub(r"^тема\s*[:“\"«]\s*", "", b["text"], flags=re.I).strip(" ”“\"»«„"); continue
            if in_recap and k == "prev": S["prev_title"] = re.sub(r"^минула тема\s*[:“\"«]\s*", "", b["text"], flags=re.I).strip(" ”“\"»«„"); continue
            if in_recap and k in ("conclusion", "challenge"):
                S["recap"].append(b); continue
            if k == "point": mode = "points"; point = {"title": b["text"], "blocks": []}; S["points"].append(point); continue
            if k == "conclusion": mode, point = "conclusion", None; S["emo"]["conclusion"] = b.get("emo", ""); continue
            if k == "challenge": mode, point = "challenge", None; S["emo"]["challenge"] = b.get("emo", ""); continue
            # звичайний заголовок усередині теми — новий пункт без номера
            if seen_theme or mode in ("intro", "points"):
                mode = "points"; point = {"title": b["text"], "blocks": []}; S["points"].append(point); continue
        target = (S["recap"] if mode == "recap" else S["conclusion"] if mode == "conclusion" else S["challenge"] if mode == "challenge" else (point["blocks"] if mode == "points" and point else S["intro"]))
        target.append(b)
    return S
