/* =====================================================================
   Спільна бібліотека сторінок подій: дати, найближчі повтори, вікно події.
   Підключення:  <script src="events/data.js"></script><script src="events/lib.js"></script>
   Далі на сторінці:  const E=window.PhiladEvents;
   ===================================================================== */
(()=>{
// events marked demo:true are examples, not real announcements: hidden unless the address has ?demo
const SHOW_DEMO=/[?&]demo\b/.test(location.search);
const D=window.PHILAD_EVENTS,ALL=D.events.filter(e=>!e.demo||SHOW_DEMO),AUD=D.AUD;
const MON=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];
const MONN=["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
const DOW=["нд","пн","вт","ср","чт","пт","сб"],DOWL=["Неділя","Понеділок","Вівторок","Середа","Четвер","П’ятниця","Субота"];
const KEY=["sun","mon","tue","wed","thu","fri","sat"],PL=["Щонеділі","Щопонеділка","Щовівторка","Щосереди","Щочетверга","Щоп’ятниці","Щосуботи"];
const day0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const same=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
// ?now=2026-10-01 in the address bar shows the site as of that day (handy for previews)
const NOW=(()=>{try{const v=new URLSearchParams(location.search).get("now");return v&&/^\d{4}-\d{2}-\d{2}$/.test(v)?parse(v):null}catch(e){return null}})();
const today=()=>NOW||day0(new Date());
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};

/* найближчі прояви подій у вікні дат: одноразові, що ще не минули, і всі щотижневі зустрічі */
function occ(from,to){
  const out=[];
  ALL.forEach(ev=>{
    if(ev.date){const d=parse(ev.date),e=ev.dateEnd?parse(ev.dateEnd):d;
      if(e>=from&&d<=to)out.push({ev,date:d,end:e,time:ev.time||""})}
    else if(ev.weekly){for(let d=from;d<=to;d=add(d,1))if(ev.weekly.days.includes(KEY[d.getDay()]))ev.weekly.times.forEach(t=>out.push({ev,date:d,end:d,time:t}))}
  });
  return out.sort((a,b)=>a.date-b.date||a.time.localeCompare(b.time))
}
const dated=()=>ALL.filter(e=>e.date&&(e.dateEnd?parse(e.dateEnd):parse(e.date))>=today()).sort((a,b)=>parse(a.date)-parse(b.date));
const weekly=()=>ALL.filter(e=>e.weekly);
/* minulі події — найновіші зверху */
const past=()=>ALL.filter(e=>e.date&&(e.dateEnd?parse(e.dateEnd):parse(e.date))<today()).sort((a,b)=>parse(b.date)-parse(a.date));
/* аудиторії, для яких зараз є події (щоб не показувати порожні кнопки фільтра) */
const audKeys=(list)=>{const used=new Set();(list||[...dated(),...weekly()]).forEach(e=>e.aud.forEach(a=>used.add(a)));return Object.entries(AUD).filter(([k])=>k!=="all"&&used.has(k))};

/* «15 листопада», «5–12 липня» */
function dayText(ev){
  const a=parse(ev.date);if(!ev.dateEnd)return a.getDate()+" "+MON[a.getMonth()];
  const b=parse(ev.dateEnd);return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${MON[a.getMonth()]}`:`${a.getDate()} ${MON[a.getMonth()]} – ${b.getDate()} ${MON[b.getMonth()]}`;
}
/* розклад однією фразою: «Щонеділі, 11:00 і 12:30» / «Нд, 22 листопада · 14:00» */
function whenText(ev){
  if(ev.weekly){const w=ev.weekly,days=w.days.map(d=>PL[KEY.indexOf(d)]);const t=w.times.join(" і ");
    return (w.days.length===1?days[0]:w.days.map(d=>DOWL[KEY.indexOf(d)]).join(", ").replace(/, ([^,]*)$/," і $1"))+", "+t}
  const a=parse(ev.date);return `${DOW[a.getDay()][0].toUpperCase()+DOW[a.getDay()][1]}, ${dayText(ev)}${ev.time?" · "+ev.time:""}`;
}
const audLabels=ev=>ev.aud.map(a=>AUD[a]);
/* скільки днів до події (для одноразових) */
const daysTo=ev=>Math.round((parse(ev.date)-today())/864e5);
const howShort=ev=>ev.how.type==="free"?"Без реєстрації":ev.how.type==="register"?"Потрібна реєстрація":"Напишіть нам";
const fmtUa=n=>n+" "+(n%10===1&&n%100!==11?"день":n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?"дні":"днів");

/* ---------- вікно події ---------- */
const CSS=`
.ev-dlg{width:min(1000px,calc(100vw - 32px));max-height:calc(100svh - 32px);padding:0;border:0;border-radius:24px;background:#F7F2E8;color:#141414;overflow:auto;box-shadow:0 40px 80px -30px rgba(0,0,0,.45);font-family:var(--sans,Manrope,system-ui,sans-serif)}
.ev-dlg::backdrop{background:rgba(20,20,20,.55);backdrop-filter:blur(4px)}
.ev-dlg[open]{animation:evIn .45s cubic-bezier(.2,.7,.2,1)}
@keyframes evIn{from{opacity:0;translate:0 24px}}
/* the picture keeps its 16:9 proportions at any width and is never cropped; the text sits below it */
.ev-dlg-in{display:grid;grid-template-columns:minmax(0,1fr)}
.ev-dlg figure{margin:0;aspect-ratio:16/9;background:#E6E1D4}
.ev-dlg figure img{width:100%;height:100%;object-fit:cover;display:block}
.ev-dlg-tx{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:36px;row-gap:12px;align-content:start;padding:24px 30px 26px}
.ev-dlg-k{grid-column:1;margin:0;font-weight:600;font-size:13px;letter-spacing:-.02em;text-transform:uppercase;color:#317C8E}
.ev-dlg h2{grid-column:1;margin:0;font-weight:600;font-size:clamp(26px,2.8vw,36px);line-height:1.1;letter-spacing:-.04em;text-wrap:balance}
.ev-dlg-p{grid-column:1;margin:0;font-weight:500;font-size:16px;line-height:1.55;color:rgba(20,20,20,.7);text-wrap:pretty}
.ev-dlg dl{grid-column:2;grid-row:1/4;margin:0;display:grid;gap:8px;align-content:start}
.ev-dlg dl div{display:grid;gap:2px;padding:10px 14px;border-radius:12px;background:rgba(20,20,20,.05)}
.ev-dlg dt{font-weight:600;font-size:12px;letter-spacing:-.01em;color:rgba(20,20,20,.5)}
.ev-dlg dd{margin:0;font-weight:600;font-size:15px;line-height:1.35;letter-spacing:-.02em}
.ev-dlg-acts{grid-column:2;display:flex;flex-wrap:wrap;gap:10px;margin-top:2px;margin-bottom:-26px;position:sticky;bottom:0;z-index:2;padding:12px 0 26px;background:linear-gradient(rgba(247,242,232,0),#F7F2E8 12px)}
.ev-dlg-acts:empty{display:none}
.ev-btn{height:48px;padding:0 22px;border-radius:12px;display:inline-flex;align-items:center;font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;text-decoration:none;border:0;cursor:pointer;background:#317C8E;color:#F7F2E8;transition:background .25s}
.ev-btn:hover{background:#28697A}.ev-btn.ghost{background:rgba(20,20,20,.07);color:#141414}.ev-btn.ghost:hover{background:rgba(20,20,20,.12)}
.ev-btn:focus-visible{outline:2px solid #141414;outline-offset:2px}
.ev-dlg-x{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(247,242,232,.92);cursor:pointer;font-size:20px;line-height:1}
.ev-dlg-x:focus-visible{outline:2px solid #141414;outline-offset:2px}
@media (max-width:760px){
 .ev-dlg{width:100vw;min-width:0;max-width:100vw;max-height:92svh;margin:auto 0 0;border-radius:22px 22px 0 0}
 .ev-dlg[open]{animation:evSheet .45s cubic-bezier(.2,.7,.2,1)}@keyframes evSheet{from{translate:0 40%}}
 .ev-dlg-tx{grid-template-columns:minmax(0,1fr);padding:22px 20px calc(24px + env(safe-area-inset-bottom,0px))}
 .ev-dlg-k,.ev-dlg h2,.ev-dlg-p,.ev-dlg dl,.ev-dlg-acts{grid-column:1}
 .ev-dlg dl{grid-row:auto}
 .ev-dlg-acts .ev-btn{flex:1 1 100%;justify-content:center}
 .ev-dlg-acts{position:sticky;bottom:0;z-index:2;margin:0 -20px calc(-24px - env(safe-area-inset-bottom,0px));padding:12px 20px calc(24px + env(safe-area-inset-bottom,0px));background:linear-gradient(rgba(247,242,232,0),#F7F2E8 14px)}
}
@media (prefers-reduced-motion:reduce){.ev-dlg[open]{animation:none}}`;
let dlg,opener,built=false;
function build(){
  if(built)return;built=true;
  const st=document.createElement("style");st.textContent=CSS;document.head.append(st);
  dlg=el("dialog","ev-dlg");dlg.setAttribute("aria-labelledby","evT");
  dlg.innerHTML=`<div class="ev-dlg-in"><figure><img alt=""></figure><div class="ev-dlg-tx"><p class="ev-dlg-k"></p><h2 id="evT"></h2><p class="ev-dlg-p"></p><dl></dl><div class="ev-dlg-acts"></div></div></div><button class="ev-dlg-x" type="button" aria-label="Закрити">×</button>`;
  document.body.append(dlg);
  dlg.querySelector(".ev-dlg-x").onclick=()=>dlg.close();
  dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
  dlg.addEventListener("close",()=>{if(opener&&opener.isConnected)opener.focus({preventScroll:true})});
  // links «до контактів» scroll to the very bottom, where the footer is pinned
  document.addEventListener("click",e=>{const a=e.target.closest("[data-to-footer]");if(!a)return;e.preventDefault();if(dlg.open)dlg.close();
    requestAnimationFrame(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}))});
}
function open(ev,from){
  build();opener=from||null;
  const q=s=>dlg.querySelector(s);
  q("img").src=ev.img;q("img").alt="";
  q(".ev-dlg-k").textContent=(ev.date&&(ev.dateEnd?parse(ev.dateEnd):parse(ev.date))<today()?"Минула подія · ":"")+(ev.weekly?(ev.every||"Щотижня"):ev.every?ev.every+" · "+dayText(ev):dayText(ev));
  q("h2").textContent=ev.title;q(".ev-dlg-p").textContent=ev.text;
  const over=ev.date&&(ev.dateEnd?parse(ev.dateEnd):parse(ev.date))<today();   // a finished event: no «how to get in», no registration button
  const rows=[["Коли",whenText(ev)],ev.place&&["Де",ev.place],["Для кого",ev.audText],!over&&["Як потрапити",ev.how.text]].filter(Boolean);
  q("dl").replaceChildren(...rows.map(([k,v])=>{const d=el("div");d.append(el("dt",null,k),el("dd",null,v));return d}));
  const acts=q(".ev-dlg-acts");acts.replaceChildren();
  const h=ev.how;
  if(h.type!=="free"&&!over){
    const a=el("a","ev-btn",h.label||"Зареєструватись");
    if(h.href&&/^https?:/.test(h.href)){a.href=h.href;a.target="_blank";a.rel="noopener"}
    else if(h.href){a.href=h.href}else{a.href="#footer";a.setAttribute("data-to-footer","")}
    a.setAttribute("data-no-u","");acts.append(a);
  }
  if(ev.href&&ev.href!==h.href){const a=el("a","ev-btn ghost","Детальніше");a.href=ev.href;a.setAttribute("data-no-u","");acts.append(a)}
  dlg.showModal();dlg.scrollTop=0;fit();
}
/* desktop: the window is as wide as it can be while the poster AND the whole text (with the register button) still fit
   the screen height — the poster is 16:9, so a narrower window means a lower poster and more room below it */
const wide=matchMedia("(min-width:761px)");
function fit(){
  if(!dlg||!dlg.open)return;
  dlg.style.width="";
  if(!wide.matches)return;
  const max=Math.min(1000,innerWidth-32),min=Math.min(480,innerWidth-32);
  for(let w=max;w>=min;w-=16){dlg.style.width=w+"px";if(dlg.scrollHeight<=dlg.clientHeight+1)break}
}
addEventListener("resize",fit);
window.PhiladEvents={ALL,AUD,MON,MONN,DOW,DOWL,KEY,parse,add,same,today,day0,occ,dated,weekly,past,audKeys,dayText,whenText,audLabels,daysTo,howShort,fmtUa,open,el};
})();
