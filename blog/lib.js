/* Блог · спільна логіка для blog.html і всіх варіантів (як /events/lib.js для подій).
   Дані — тільки з blog/data.js. Тут: вкладки, фільтр за темами, пошук, картинка запису, вікно відео, «Показати ще».
   Сторінка-варіант лише малює картки: PhiladBlog.onChange(list=>…). */
(()=>{
const D=window.PHILAD_BLOG,B=window.PhiladBlog={};
const el=B.el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};
const MON=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];
B.MON=MON;B.posts=D.posts;B.TABS=D.TABS;B.THEMES=D.THEMES;
B.parse=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
B.date=p=>{const d=B.parse(p.date);return`${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`};
B.kind=p=>p.kind==="video"&&p.sub==="interview"?"Відеоінтерв’ю":D.KINDS[p.kind]||"Запис";
B.len=p=>p.kind==="video"?"Дивитись":p.min?`${p.min} хв читання`:"";
B.plural=n=>{const a=n%10,b=n%100;return a===1&&b!==11?"запис":a>=2&&a<=4&&(b<12||b>14)?"записи":"записів"};

/* ---------- стан: вкладка · тема · пошук · порядок (зберігається в адресі: #tab=stati&theme=war) ---------- */
const S=B.state={tab:"all",theme:"all",q:"",sort:"new"};
new URLSearchParams(location.hash.slice(1)).forEach((v,k)=>{if(k in S)S[k]=v});
if(!D.TABS.some(t=>t[0]===S.tab))S.tab="all";
if(S.theme!=="all"&&!D.THEMES[S.theme])S.theme="all";
B.byTab=t=>t==="all"?D.posts:D.posts.filter(p=>p.tabs.includes(t));
B.list=()=>{
  const q=S.q.trim().toLowerCase();
  const l=B.byTab(S.tab).filter(p=>(S.theme==="all"||p.themes.includes(S.theme))&&(!q||(p.title+" "+p.text).toLowerCase().includes(q)));
  return S.sort==="old"?[...l].reverse():l};
const subs=[];B.onChange=f=>{subs.push(f);f(B.list())};
B.set=patch=>{
  Object.assign(S,patch);
  if(S.theme!=="all"&&!B.byTab(S.tab).some(p=>p.themes.includes(S.theme)))S.theme="all";   // у новій вкладці такої теми немає
  const h=new URLSearchParams();if(S.tab!=="all")h.set("tab",S.tab);if(S.theme!=="all")h.set("theme",S.theme);
  history.replaceState(null,"",location.pathname+location.search+(h.size?"#"+h:""))   /* повний шлях: на «чистих» адресах стоїть <base href="/"> */;
  sync.forEach(f=>f());const l=B.list();subs.forEach(f=>f(l))};
const sync=[];
addEventListener("hashchange",()=>{const n={tab:"all",theme:"all"};new URLSearchParams(location.hash.slice(1)).forEach((v,k)=>{if(k in n)n[k]=v});
  if(!D.TABS.some(t=>t[0]===n.tab))n.tab="all";if(n.theme!=="all"&&!D.THEMES[n.theme])n.theme="all";if(n.tab!==S.tab||n.theme!==S.theme)B.set(n)});

/* вкладки: <div id> → кнопки; counts — показувати кількість записів */
B.tabs=(box,{counts=true,cls="bl-tab"}={})=>{
  box.setAttribute("role","tablist");
  D.TABS.forEach(([id,label])=>{
    const b=el("button",cls);b.type="button";b.setAttribute("role","tab");b.append(el("span",null,label));
    if(counts)b.append(el("sup",null,String(B.byTab(id).length)));
    b.onclick=()=>B.set({tab:id});box.append(b);
    sync.push(()=>b.setAttribute("aria-selected",S.tab===id?"true":"false"))});
  sync.forEach(f=>f())};
/* теми: чипи; теми, яких у вибраній вкладці немає, ховаються */
B.themes=(box,{cls="bl-chip",all="Усі теми",counts=false}={})=>{
  [["all",all],...Object.entries(D.THEMES)].forEach(([id,label])=>{
    const b=el("button",cls);b.type="button";b.append(el("span",null,label));const c=counts?el("sup"):null;if(c)b.append(c);
    b.onclick=()=>B.set({theme:S.theme===id&&id!=="all"?"all":id});box.append(b);
    const f=()=>{const n=id==="all"?B.byTab(S.tab).length:B.byTab(S.tab).filter(p=>p.themes.includes(id)).length;
      b.hidden=!n;b.setAttribute("aria-pressed",S.theme===id?"true":"false");if(c)c.textContent=n};
    sync.push(f);f()})};
B.themeTags=p=>{const u=el("span","bl-tags");p.themes.forEach(t=>u.append(el("span",null,D.THEMES[t])));return u};

/* ---------- картинка запису: фото, а якщо його немає — спокійна заглушка; на відео — кнопка «грати» ---------- */
B.pic=(p,cls="bl-pic")=>{
  const f=el("span",cls);
  if(p.img){const im=new Image();im.src=p.img;im.alt="";im.loading="lazy";im.decoding="async";f.append(im)}
  else{f.classList.add("none");f.append(el("i",null,B.kind(p)))}
  if(p.kind==="video")f.insertAdjacentHTML("beforeend",'<b class="bl-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></b>');
  return f};
/* картка-посилання: веде на сторінку запису на новому сайті */
B.link=(p,cls)=>{const a=el("a",cls);a.href=p.page;a.dataset.noU="";return a};

/* ---------- вікно відео ---------- */
let dlg;
B.play=(p,from)=>{
  if(!dlg){dlg=el("dialog","bl-dlg");document.body.append(dlg);
    dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
    dlg.addEventListener("close",()=>{dlg.replaceChildren();dlg._from&&dlg._from.focus()})}
  dlg._from=from;
  const x=el("button","bl-dlg-x","×");x.type="button";x.setAttribute("aria-label","Закрити");x.onclick=()=>dlg.close();
  const v=el("div","bl-dlg-v");v.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${p.yt}?autoplay=1&rel=0" title="" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  v.firstChild.title=p.title;
  const t=el("div","bl-dlg-t");t.append(el("p","bl-k",`${B.kind(p)} · ${B.date(p)}`),el("h2",null,p.title));if(p.text)t.append(el("p","bl-dlg-p",p.text));
  dlg.replaceChildren(x,v,t);dlg.showModal()};

/* ---------- автопідвантаження: коли низ списку наближається до екрана, показуємо наступну порцію ----------
   Кнопка «Показати ще» лишається лише як запасний варіант (без IntersectionObserver) — зі скрипту вона невидима. */
B.pager=(btn,step)=>{let n=step,total=0,draw=()=>{},io=null;
  const more=()=>{if(n>=total)return;n+=step;draw(n);upd();watch()};
  const upd=()=>{btn.hidden=n>=total;btn.textContent=`Показати ще ${Math.min(step,total-n)}`};
  const watch=()=>{if(!io||btn.hidden)return;io.unobserve(btn);requestAnimationFrame(()=>io.observe(btn))};   // нове спостереження: якщо низ усе ще на екрані — підвантажимо далі
  btn.onclick=more;
  if("IntersectionObserver" in window){
    btn.classList.add("auto");btn.tabIndex=-1;btn.setAttribute("aria-hidden","true");
    io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))more()},{rootMargin:"0px 0px 900px 0px"})}
  return(len,f)=>{n=step;total=len;draw=f;f(n);upd();watch()}};

/* поява блоків під час прокрутки */
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -6% 0px"});
B.reveal=(root=document)=>root.querySelectorAll(".rv:not(.in)").forEach(x=>reduce?x.classList.add("in"):io.observe(x));

addEventListener("DOMContentLoaded",()=>B.reveal());
})();
