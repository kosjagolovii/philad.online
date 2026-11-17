import html
E=lambda s:html.escape(s,quote=True)
# (chapter, year, title, sub, [images], video)
C="Контекст";S="Створення";I="Історія";M="Молодь Філадельфії";B="Будівництво";V="Козачок і відкриття";T="Сьогодні"
ev=[
(C,"70 років комунізму","Порожнеча — і прагнення до істини","залишили по собі порожнечу, але прагнення до істини не згасло",["news"],None),
(C,"","Люди шукали живу віру","прагнучи знайти Бога",["queue","crowd"],"2:03"),
(S,"31 жовтня 1992","Євангелізація в Палаці спорту","Віктор Прохор та Уолтер Зігаревич організували євангелізацію в Палаці спорту",["palace"],"1:48"),
(S,"","Без фінансів і гарантій","але з великою вірою",["three"],None),
(S,"","Народилася нова спільнота","У самому залі звучала Євангелія, пісні та заклик до покаяння. Того вечора народилася нова спільнота",["stage","cry"],"5:03"),
(S,"","Не маючи приміщення","тоді збиралися в бібліотеці Вернадського",["library"],None),
(I,"Травень 1993","Перше водне хрещення","Тоді у басейні хрестили 27 людей",["bap1","bap3"],None),
(I,"13 квітня 1994","Заснування церкви","Після першого служіння було засновано церкву",["doc"],None),
(I,"1 січня 1995","Назва «Філадельфія»","Назву обрали — «Філадельфія», що означає братерська любов",["logos","p95a","p95b","p95c"],None),
(M,"","Перші молодіжні служіння","проходили в гуртожитку брата Петра Леонтійовича",["y029","y031"],None),
(M,"","Співи, роздуми над Словом Божим і мрії","",["y018","yigor"],None),
(M,"","Молодь виходила в парки","Євангелізація, молитви та співи.",["y042"],None),
(M,"1998","Духовне зростання","Це був час духовного зростання та формування спільноти",["sis9","bap98"],None),
(B,"1997","Початок будівництва","церковна рада вирішила почати будівництво церкви",["c001"],None),
(B,"","Земля для церкви","Землю для будівництва було отримано за підтримки мера Києва",["c008"],None),
(B,"","Бог відкривав двері","через молитви, через зустрічі з владою",["c014"],None),
(B,"","Перший камінь","заклали Віктор Прохор, Микола Мельник і Френк Мартін",["c021","c013"],None),
(B,"","Служіння єдності","Усі члени церкви працювали разом — це було служіння єдності",["c003","c038"],None),
(B,"","Віктор Прохор","процитував слова: «Хто вважає на вітер, не буде сіяти…»",["sis03"],None),
(B,"7 січня 1999","І церква почала молитися","Різдво Христове",["xmas99"],None),
(B,"10 червня 1999","Поки будівництво тривало","служіння проходили в поліклініці навпроти",["b1999","sis6","sis5"],None),
(V,"1998","Пасторство прийняв Анатолій Козачок","Проводи родини В. С. Прохора до США, 20 грудня 1998",["prokhor98"],None),
(V,"11 вересня 2000","Святкове відкриття церкви «Філадельфія»","",["o1","o2"],None),
(V,"","Мрії стали реальністю","Тоді мрії про своє приміщення стали реальністю",["o3","o4"],None),
(T,"Сьогодні","Це не просто будівля","церква «Філадельфія» — це спільнота",["today1"],None),
(T,"","Спільнота, яка змінює життя","",["comm2","comm3","comm1"],None),
(T,"","Де кожен може знайти Бога","",["comm5","comm4"],None),
]
PEOPLE={"comm5":("Анатолій Фещенко","Старший пастор церкви Філадельфія"),"comm4":("Юрій Кавун","Пастор церкви Філадельфія")}
def pcap(i):
    if i not in PEOPLE:return ''
    n,r=PEOPLE[i]
    return f'<figcaption class="pc"><b data-k="cap-{i}-n">{E(n)}</b><span data-k="cap-{i}-r">{E(r)}</span></figcaption>'
def imgs(l,cls):
    n=len(l)
    return f'<div class="im n{n}">'+"".join(f'<figure class="ph"><img src="history/img/{i}.webp" alt="{E(cls)}" loading="lazy" decoding="async">{pcap(i)}</figure>' for i in l)+'</div>'
def gal(l,t):
    n=len(l)
    return f'<div class="gal n{n}" tabindex="0" aria-label="{E(t)}: {n} фото"><span class="gal-n">{n} фото</span>'+"".join(f'<figure class="ph" data-k="{k}"><img src="history/img/{i}.webp" alt="{E(t)}" loading="lazy" decoding="async"></figure>' for k,i in enumerate(l))+'</div>'
def vid(t): return f'<div class="vid"><span class="vid-play"></span><span class="vid-t">Відео · {t}</span><span class="vid-s">з’явиться незабаром</span></div>'
WIDE=[]
DEF={'e1t':'70 років комунізму','e1y':'1991','e10s':'проходили в гуртожитку брата Петра Леонтійовича','e6s':'тоді збиралися в бібліотеці Вернадського'}  # правки з тюнера, перенесені в основу
cap=lambda x:x[:1].upper()+x[1:] if x else x
def build(variant):
    out=[];last=None;k=0
    for ch,y,t,s,im,v in ev:
        t=cap(t);s=cap(s);y=cap(y)
        first=False
        if ch!=last:
            first=True
            if variant=='b':
                out.append(f'<div class="ch" id="c{k}"><span>{E(ch)}</span></div>')
            last=ch
        k+=1
        t=DEF.get(f'e{k}t',t);s=DEF.get(f'e{k}s',s);y=DEF.get(f'e{k}y',y)
        yr=f'<p class="yr" data-k="e{k}y">{E(y)}</p>' if y else ''
        sub=f'<p class="sub" data-k="e{k}s">{E(s)}</p>' if s else ''
        wide=''
        if variant=='c':
            im=[x for x in im if x!="logos"]
            if "comm1" in im:
                im=[x for x in im if x!="comm1"]
                wide='<figure class="ph wide" data-wide><img src="history/img/comm1.jpg" alt="Вся церква біля будівлі" loading="lazy" decoding="async"></figure>'
        pics=(gal(im,t) if (variant=='c' and len(im)>=3) else imgs(im,t))
        tag=f'<p class="chp" data-k="e{k}c">{E(ch)}</p>' if (first and variant=='c') else ''
        body=tag+f'<h3 data-k="e{k}t">{E(t)}</h3>{sub}'+pics+(vid(v) if v else '')
        if variant=='b':
            out.append(f'<article class="it rv"><span class="nd"></span><div class="card">{yr}{body}</div></article>')
        else:
            ycell=yr or '<span class="yd"></span>'
            out.append(f'<article class="it rv{" hc" if first else ""}{" hy" if y else ""}"><span class="nd"></span><div class="yc">{ycell}</div><div class="bd">{body}</div></article>')
            if wide: WIDE.append(wide)
    return "\n".join(out)

common='''
:root{--ds-cream:#F7F2E8;--ink:#141414;--teal:#317C8E;--teal-ink:#28697A;--sand:#E6E1D4;--sans:"Manrope",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--side:12px;color-scheme:light}
html,body{margin:0;padding:0;background:var(--ds-cream);color:var(--ink)}
body{font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:clip}
img{max-width:100%;display:block}[hidden]{display:none!important}
.h{position:relative;z-index:1;background:var(--ds-cream);padding-block:150px 120px;padding-left:max(var(--side),env(safe-area-inset-left,0px));padding-right:max(var(--side),env(safe-area-inset-right,0px));display:grid;justify-items:center;gap:80px}
.h>*{min-width:0;width:var(--row);max-width:100%;box-sizing:border-box}
.top{display:grid;justify-items:center;gap:22px;text-align:center}
.kicker{margin:0;font-weight:600;font-size:14px;letter-spacing:-.057em;text-transform:uppercase;color:var(--teal)}
.top h1{margin:0;font-weight:500;font-size:clamp(44px,6vw,88px);line-height:1.04;letter-spacing:-.055em;text-wrap:balance}
.top h1 span{color:rgba(20,20,20,.45)}
.lead{margin:0;max-width:620px;font-weight:500;font-size:clamp(17px,1.5vw,21px);line-height:1.4;letter-spacing:-.03em;color:rgba(20,20,20,.62)}
.rv{opacity:0;translate:0 32px;transition:opacity .9s cubic-bezier(.2,.7,.2,1),translate .9s cubic-bezier(.2,.7,.2,1)}.rv.in{opacity:1;translate:0 0}
.ph{position:relative;margin:0;border-radius:20px;overflow:hidden;background:var(--sand)}
.ph img{width:100%;height:100%;object-fit:cover;aspect-ratio:3/2;transition:scale 1.1s cubic-bezier(.2,.7,.2,1)}.ph:hover img{scale:1.04}
.im{display:grid;gap:12px}.im.n2,.im.n4{grid-template-columns:1fr 1fr}.im.n3{grid-template-columns:1fr 1fr}.im.n3 .ph:first-child{grid-column:1/-1}
.im .ph img{aspect-ratio:3/2}.im.n1 .ph img{aspect-ratio:16/10}
.yr{margin:0;font-weight:700;font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:var(--teal)}
h3{margin:0;font-weight:500;font-size:clamp(26px,2.8vw,40px);line-height:1.08;letter-spacing:-.05em;text-wrap:balance}
.sub{margin:0;font-weight:500;font-size:clamp(16px,1.4vw,19px);line-height:1.4;letter-spacing:-.025em;color:rgba(20,20,20,.62)}
.vid{position:relative;display:grid;place-content:center;justify-items:center;gap:4px;aspect-ratio:16/9;border-radius:20px;background:var(--sand);overflow:hidden;text-align:center}
.vid::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(20,20,20,.035) 0 14px,transparent 14px 28px)}.vid>*{position:relative}
.vid-play{width:60px;height:60px;border-radius:50%;background:var(--teal);display:grid;place-items:center;margin-bottom:6px}
.vid-play::after{content:"";margin-left:4px;border-left:15px solid var(--ds-cream);border-block:9px solid transparent}
.vid-t{font-weight:700;font-size:14px}.vid-s{font-weight:600;font-size:12px;color:rgba(20,20,20,.5)}
/* timeline spine */
.tl{position:relative}
.ln{position:absolute;top:0;bottom:0;width:2px;background:rgba(20,20,20,.14);border-radius:2px}
.ln i{position:absolute;left:0;top:0;width:100%;height:0;background:var(--teal);border-radius:2px}
.dot{position:absolute;left:50%;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:var(--teal);box-shadow:0 0 0 7px rgba(49,124,142,.18),0 8px 20px -6px rgba(40,105,122,.7);z-index:3;will-change:transform}
.ch{position:relative;z-index:2;display:flex;justify-content:center;margin:clamp(56px,8vw,110px) 0 clamp(28px,4vw,56px)}
.ch span{padding:12px 24px;border-radius:999px;background:var(--ink);color:var(--ds-cream);font-weight:600;font-size:15px;letter-spacing:-.03em}
.ch:first-child{margin-top:0}
.it{position:relative}
.nd{position:absolute;top:34px;width:14px;height:14px;border-radius:50%;background:var(--ds-cream);border:2px solid rgba(20,20,20,.25);transition:background .4s,border-color .4s,scale .4s;z-index:2}
.it.on .nd{background:var(--teal);border-color:var(--teal);scale:1.15}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;translate:none;transition:none}.ph img{transition:none}}
'''
SNIP='''
/* люди в кадрі: не обрізаємо голови; широкі/вертикальні кадри показуємо у природних пропорціях */
.ph img{object-position:50% 24%}
img[src$="/doc.webp"],img[src$="/xmas99.webp"],img[src$="/bap1.webp"],img[src$="/sis03.webp"],img[src$="/c021.webp"]{aspect-ratio:auto!important;height:auto!important;object-fit:contain!important}
.ph:has(img[src$="/doc.webp"]){background:transparent}
.ph:has(img[src$="/sis03.webp"]),.ph:has(img[src$="/c021.webp"]),.ph:has(img[src$="/doc.webp"]){max-width:68%}
.gal .ph img{object-position:50% 14%}.gal .ph:has(img[src$="/p95a.webp"]) img{object-position:50% 8%}
'''
cssB='''
.tl{padding-block:10px}
.tl .ln{left:50%;margin-left:-1px}
.it{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:clamp(56px,8vw,130px);margin-bottom:clamp(40px,6vw,88px)}
.it .card{display:grid;gap:14px;max-width:560px}
.it:nth-of-type(odd) .card{grid-column:1;justify-self:end}
.it:nth-of-type(even) .card{grid-column:2;justify-self:start}
.nd{left:50%;margin-left:-7px}
@media (max-width:800px){
  :root{--side:16px}
  .h{padding-block:120px 80px;gap:56px}
  .top{text-align:left;justify-items:start}
  .tl .ln{left:11px;margin-left:-1px}
  .dot{left:11px}
  .nd{left:11px}
  .it{grid-template-columns:1fr;padding-left:44px}
  .it:nth-of-type(odd) .card,.it:nth-of-type(even) .card{grid-column:1;justify-self:stretch;max-width:none}
  .ch{justify-content:flex-start;padding-left:0}
}
'''
cssC='''
.tl{max-width:920px;margin-inline:auto}
.tl .ln{left:150px;margin-left:0;width:1px}
.dot{left:150px;width:14px;height:14px;margin:-7px 0 0 -7px;box-shadow:0 0 0 5px rgba(49,124,142,.16),0 6px 14px -6px rgba(40,105,122,.7)}
.chp{justify-self:start;margin:0 0 2px;font-weight:600;font-size:14px;line-height:1.3;letter-spacing:-.057em;text-transform:uppercase;color:var(--teal)}
.it{display:grid;grid-template-columns:150px minmax(0,1fr);column-gap:56px;margin-bottom:clamp(44px,6vw,80px);position:relative}
.yc{text-align:right;padding-top:38px;padding-right:30px}
.yc .yr{font-size:14px;line-height:1.25}
.nd{box-sizing:border-box;left:150px;width:7px;height:7px;margin-left:-3px;top:44px;border-width:1.5px}
.it.hy .nd{width:15px;height:15px;margin-left:-7px;top:40px;border-width:2px;border-color:var(--teal)}
.it.hy.on .nd{box-shadow:0 0 0 5px rgba(49,124,142,.16)}
.bd{display:grid;gap:16px;padding-top:22px;min-width:0}
.it.hc .yc{padding-top:63px}.it.hc .nd{top:69px}.it.hc.hy .nd{top:65px}
.bd h3{font-size:clamp(28px,3.2vw,46px)}
/* images — always one column, one under another */
.tl .im{grid-template-columns:1fr;gap:14px}
.tl .im .ph:first-child{grid-column:auto}
.tl .im .ph img{aspect-ratio:16/10}
.tl .im .ph,.gal .ph{cursor:zoom-in}
/* mini gallery: a pile that fans out on hover */
.gal{position:relative;aspect-ratio:16/10;margin-block:8px 6px;outline:none;perspective:1200px}
.gal .ph{position:absolute;left:20%;top:3%;width:60%;border-radius:16px;box-shadow:0 18px 36px -18px rgba(0,0,0,.45);transition:transform .7s cubic-bezier(.2,.8,.2,1);transform-origin:50% 70%}
.gal .ph img{aspect-ratio:3/2;height:auto}
.gal .ph:hover img{scale:1}
.gal .ph:nth-child(2){z-index:4}.gal .ph:nth-child(3){z-index:3}.gal .ph:nth-child(4){z-index:2}.gal .ph:nth-child(5){z-index:1}
.gal .ph:nth-child(2){transform:rotate(0)}
.gal .ph:nth-child(3){transform:rotate(-5deg) translate(-3%,2%)}
.gal .ph:nth-child(4){transform:rotate(5deg) translate(3%,2%)}
.gal .ph:nth-child(5){transform:rotate(-9deg) translate(-5%,4%)}
.gal:hover .ph:nth-child(2),.gal:focus-visible .ph:nth-child(2){transform:translate(0,-4%) scale(1.02)}
.gal:hover .ph:nth-child(3),.gal:focus-visible .ph:nth-child(3){transform:translate(-33%,8%) rotate(-8deg)}
.gal:hover .ph:nth-child(4),.gal:focus-visible .ph:nth-child(4){transform:translate(33%,8%) rotate(8deg)}
.gal:hover .ph:nth-child(5),.gal:focus-visible .ph:nth-child(5){transform:translate(0,38%) rotate(-3deg)}
.gal-n{position:absolute;right:2%;bottom:0;z-index:9;padding:7px 12px;border-radius:999px;background:var(--ink);color:var(--ds-cream);font-weight:600;font-size:12px;letter-spacing:-.01em;pointer-events:none}
/* wide closing photo — the timeline ends on it */
.h>.ph.wide{margin:-80px 0 0;width:var(--row);max-width:100%;z-index:1;box-sizing:border-box}
.it:last-of-type{margin-bottom:clamp(36px,5vw,60px)}
@media (max-width:700px){.h>.ph.wide{margin-top:-56px}}
/* wide closing photo: full content width, grows on scroll */
.h>.ph.wide{position:relative;border-radius:28px;transform:scale(var(--s,.8));transform-origin:50% 50%;cursor:zoom-in;will-change:transform}
.ph.wide img{transition:none}.ph.wide:hover img{scale:1}
.ph.wide img{aspect-ratio:auto!important;height:auto!important;object-fit:contain!important}
@media (hover:hover) and (pointer:fine){.ph.wide{cursor:none}}
.lens{position:fixed;left:0;top:0;z-index:60;width:230px;height:230px;border-radius:50%;pointer-events:none;border:3px solid #fff;box-shadow:0 22px 50px -10px rgba(0,0,0,.45),inset 0 0 0 1px rgba(0,0,0,.08);background-repeat:no-repeat;opacity:0;scale:.55;transition:opacity .2s,scale .3s cubic-bezier(.3,1.3,.5,1)}
.lens.on{opacity:1;scale:1}
.lens::after{content:"3×";position:absolute;right:18px;bottom:12px;font-weight:700;font-size:12px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.6)}
/* person captions */
.ph figcaption.pc{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(to top,rgba(0,0,0,.62),rgba(0,0,0,.28) 55%,transparent);display:grid;gap:3px;padding:64px 26px 22px;color:#fff}
.ph figcaption.pc b{font-weight:600;font-size:clamp(18px,1.8vw,24px);letter-spacing:-.03em}
.ph figcaption.pc span{font-weight:600;font-size:13px;letter-spacing:-.01em;opacity:.85}
/* lightbox */
.lb{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(10,10,10,.92);backdrop-filter:blur(6px)}
.lb.open{display:flex;animation:lbIn .3s ease}
@keyframes lbIn{from{opacity:0}}
.lb img{max-width:min(94vw,1500px);max-height:88vh;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,.6);object-fit:contain}
.lb button{position:absolute;box-sizing:border-box;flex:none;border:0;cursor:pointer;width:44px;height:44px;padding:0;border-radius:50%;background:#fff;color:var(--ink);display:grid;place-items:center;transition:scale .3s cubic-bezier(.3,1.4,.5,1),background .2s}
.lb button:hover{scale:1.08;background:var(--ds-cream)}
.lb button svg{display:block}
.lb .lb-x{top:max(18px,env(safe-area-inset-top,0px));right:18px}
.lb .lb-pv{left:18px;top:50%;margin-top:-22px}.lb .lb-nx{right:18px;top:50%;margin-top:-22px}
.lb .lb-ct{position:absolute;bottom:max(18px,env(safe-area-inset-bottom,0px));left:0;right:0;text-align:center;color:rgba(247,242,232,.7);font-weight:600;font-size:13px}
.lb.one .lb-pv,.lb.one .lb-nx,.lb.one .lb-ct{display:none}
@media (max-width:700px){
  :root{--side:16px}
  .h{padding-block:120px 80px;gap:56px}
  .top{text-align:left;justify-items:start}
  .tl .ln,.nd,.dot{left:11px}
  .nd{margin-left:-3px}.it.hy .nd{margin-left:-7px}
  .dot{margin-left:-7px}
  .it{grid-template-columns:1fr;padding-left:44px;column-gap:0}
  .yc{text-align:left;padding-top:26px;padding-right:0}
  .yc:has(.yd){display:none}
  .it .nd,.it.hc .nd{top:18px}.it.hy .nd,.it.hc.hy .nd{top:27px}.it.hc .yc{padding-top:26px}
  .bd{padding-top:6px}
  .gal .ph{left:12%;width:76%}
  .gal:hover .ph:nth-child(3){transform:translate(-20%,6%) rotate(-7deg)}
  .gal:hover .ph:nth-child(4){transform:translate(20%,6%) rotate(7deg)}
  .lb .lb-pv{left:8px}.lb .lb-nx{right:8px}
}
'''
js='''

(()=>{
  const reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -8% 0px",threshold:.06});
  document.querySelectorAll(".rv").forEach(el=>io.observe(el));
  const tl=document.querySelector(".tl"),fill=tl.querySelector(".ln i"),dot=tl.querySelector(".dot"),its=[...tl.querySelectorAll(".it")];
  let t=false;
  const upd=()=>{t=false;const r=tl.getBoundingClientRect(),y=Math.max(0,Math.min(r.height,innerHeight*.5-r.top));
    fill.style.height=y+"px";dot.style.transform=`translateY(${y}px)`;
    its.forEach(i=>{const b=i.getBoundingClientRect();i.classList.toggle("on",b.top+40<innerHeight*.5)})};
  const wides=[...document.querySelectorAll(".ph.wide")];
  const grow=()=>wides.forEach(w=>{const r=w.getBoundingClientRect(),vh=innerHeight;let p=(vh-r.top)/(vh*.75);p=Math.max(0,Math.min(1,p));p=1-Math.pow(1-p,3);w.style.setProperty("--s",reduce?1:(.8+.2*p).toFixed(4))});
  const upd0=upd;
  addEventListener("scroll",()=>{if(!t){t=true;requestAnimationFrame(()=>{upd0();grow()})}},{passive:true});grow();addEventListener("resize",upd);upd();
})();

(()=>{
  const fig=document.querySelector(".ph.wide");if(!fig||!matchMedia("(hover:hover) and (pointer:fine)").matches)return;
  const img=fig.querySelector("img"),lens=document.createElement("div");lens.className="lens";document.body.append(lens);
  const R=115,Z=3;
  const move=e=>{const r=img.getBoundingClientRect();const fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;
    if(fx<0||fx>1||fy<0||fy>1){lens.classList.remove("on");return}
    lens.style.backgroundImage=`url("${img.currentSrc||img.src}")`;
    lens.style.backgroundSize=`${r.width*Z}px ${r.height*Z}px`;
    lens.style.backgroundPosition=`${-(fx*r.width*Z-R)}px ${-(fy*r.height*Z-R)}px`;
    lens.style.transform=`translate(${e.clientX-R}px,${e.clientY-R}px)`;lens.classList.add("on")};
  fig.addEventListener("pointerenter",move);fig.addEventListener("pointermove",move);
  fig.addEventListener("pointerleave",()=>lens.classList.remove("on"));
  fig.addEventListener("click",()=>lens.classList.remove("on"));
})();

(()=>{
  const css=document.querySelector(".gal,.tl .im");if(!css||!document.querySelector(".gal"))return;
  const lb=document.createElement("div");lb.className="lb";lb.setAttribute("role","dialog");lb.setAttribute("aria-modal","true");
  lb.innerHTML='<button class="lb-x" aria-label="Закрити"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l12 12M15 3L3 15"/></svg></button><button class="lb-pv" aria-label="Попереднє"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11H4M10 5l-6 6 6 6"/></svg></button><img alt=""><button class="lb-nx" aria-label="Наступне"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h14M12 5l6 6-6 6"/></svg></button><div class="lb-ct"></div>';
  document.body.append(lb);
  const im=lb.querySelector("img"),ct=lb.querySelector(".lb-ct");let list=[],k=0,last=null;
  const show=()=>{const f=list[k];im.src=f.querySelector("img").currentSrc||f.querySelector("img").src;im.alt=f.querySelector("img").alt;ct.textContent=(k+1)+" / "+list.length};
  const open=(fig)=>{const grp=fig.closest(".gal,.im")||fig;list=grp===fig?[fig]:[...grp.querySelectorAll(".ph")];k=list.indexOf(fig);lb.classList.toggle("one",list.length<2);last=document.activeElement;show();lb.classList.add("open");document.documentElement.style.overflow="hidden";lb.querySelector(".lb-x").focus()};
  const close=()=>{lb.classList.remove("open");document.documentElement.style.overflow="";if(last&&last.focus)last.focus()};
  const step=d=>{k=(k+d+list.length)%list.length;show()};
  document.addEventListener("click",e=>{const f=e.target.closest(".tl .ph,.ph.wide");if(f&&!e.target.closest("[contenteditable]"))open(f)});
  document.querySelectorAll(".gal").forEach(g=>g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open(g.querySelector(".ph"))}}));
  lb.addEventListener("click",e=>{if(e.target===lb||e.target.closest(".lb-x"))close();else if(e.target.closest(".lb-pv"))step(-1);else if(e.target.closest(".lb-nx"))step(1)});
  addEventListener("keydown",e=>{if(!lb.classList.contains("open"))return;if(e.key==="Escape")close();else if(e.key==="ArrowLeft")step(-1);else if(e.key==="ArrowRight")step(1)});
  let sx=null;lb.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});lb.addEventListener("touchend",e=>{if(sx==null||list.length<2)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)step(dx<0?1:-1);sx=null});
})();
'''
def page(variant,title,lead,css):
    WIDE.clear();BODY=build(variant);WIDEHTML=''.join(WIDE)
    return f'''<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<script src="components/site.js"></script>
<style>{common}{css}{SNIP}</style>
</head>
<body>
<site-menu tone="auto"></site-menu>
<main class="h">
  <div class="top rv"><p class="kicker" data-k="kicker">Історія</p><h1>Історія церкви<br><span>«Філадельфія»</span></h1></div>
  <div class="tl"><div class="ln"><i></i></div><div class="dot"></div>
{BODY}
  </div>
{WIDEHTML}
</main>
<site-footer></site-footer>
<script>{js}</script>
<script src="components/text-tuner.js" data-name="history"></script>
</body>
</html>'''
open('history.html','w',encoding='utf-8').write(page('c','Історія церкви','',cssC))
