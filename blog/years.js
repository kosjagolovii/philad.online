/* Блог: ряд РОКІВ замість ряду тем (додатковий фільтр до вкладки й пошуку). Підключається ПІСЛЯ blog/list.js; стилі — blog/years.css. */
(()=>{
const B=window.PhiladBlog,el=B.el,S=B.state;
let Y=new URLSearchParams(location.hash.slice(1)).get("year")||"";
const orig=B.list;B.list=()=>orig().filter(p=>!Y||p.year===Y);
const years=[...new Set(B.posts.map(p=>p.year))].sort().reverse();
const themes=document.getElementById("themes");themes.hidden=true;                 // теми не показуємо — замість них роки
const row=el("div","mg-yrs");row.setAttribute("role","group");row.setAttribute("aria-label","Рік");
/* ряд вкладок: праворуч лічильник записів і «Очистити фільтри» (з'являється, коли щось обрано) */
const tabsBox=document.getElementById("tabs"),count=document.getElementById("count"),bar=document.querySelector(".a-bar");
const trow=el("div","mg-tabrow");tabsBox.before(trow);trow.append(tabsBox);
const side=el("div","mg-meta");trow.append(side);side.append(count);
const clear=el("button","mg-clear","Очистити фільтри");clear.type="button";clear.hidden=true;side.append(clear);
if(bar)bar.hidden=true;
const q=document.getElementById("q");
clear.onclick=()=>{Y="";if(q)q.value="";B.set({tab:"all",theme:"all",q:""})};
const find=document.querySelector(".bl-find"),line=el("div","mg-line");     // пошук і роки — один рядок: спершу пошук, далі роки (не вміщаються — гортаються вбік)
(bar||themes).before(line);if(find)line.append(find);line.append(row);
const num=y=>orig().filter(p=>!y||p.year===y).length;
const btn=["",...years].map(y=>{
  const b=el("button","mg-yb");b.type="button";b.onclick=()=>{Y=Y===y?"":y;B.set({})};
  b.append(el("span",null,y||"Усі роки"),el("sup"));
  row.append(b);return[y,b]});
B.onChange(()=>{
  btn.forEach(([y,b])=>{const n=num(y);b.setAttribute("aria-pressed",String(Y===y));b.disabled=!!y&&!n;
    b.querySelector("sup").textContent=n;});
  clear.hidden=!(S.tab!=="all"||Y||S.q);
  const h=new URLSearchParams();if(S.tab!=="all")h.set("tab",S.tab);if(Y)h.set("year",Y);
  try{history.replaceState(null,"",location.pathname+location.search+(h.size?"#"+h:""))}catch(e){}});
if(Y)B.set({});   // перехід за посиланням із роком (#year=2018): одразу перемальовуємо список
})();
