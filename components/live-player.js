/* =====================================================================
   Філадельфія · плеєр «LIVE трансляція» — спільний компонент <live-player>
   ---------------------------------------------------------------------
   Підключення: <script src="components/live-player.js"></script> після site.js,
   далі <live-player variant="a|b|c"></live-player> (variant — вигляд кнопок).

   Як працює:
   1. Відкриває вбудований плеєр каналу (embed/live_stream?channel=…). Якщо йде ефір — показує його.
      Якщо ефіру немає, YouTube повертає помилку 150, і плеєр сам переходить до пункту 2.
   2. Показує останню завершену трансляцію каналу з live/latest.json
      (його оновлює update-live.py; без файла береться запасне відео FALLBACK нижче).
   Відео стартує саме (без звуку — так вимагають браузери), «Увімкнути звук» — одним кліком.
   Рідні кнопки YouTube сховані, замість них — власні (пауза, звук, перемотування, повний екран).
   Підпис під відео: «LIVE трансляція» + дата; для запису ще «Трансляція відбулась».
   ===================================================================== */
(function(){
"use strict";
const me=document.currentScript;
const BASE=new URL("../",me.src).href;
const CHANNEL="UCX5HigmEAtVy2vpuGpKcCiQ";                    // youtube.com/@philadkyiv
const CHANNEL_URL="https://www.youtube.com/@philadkyiv/streams";
const FALLBACK={id:"E0NxPiqECLM",startedAt:"2026-11-15T09:00:17+00:00"};   // якщо live/latest.json недоступний
const PV="autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0";
const LIVE_WAIT=9000;                                         // стільки чекаємо на ефір, потім — запис

const I={
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path transform="translate(-1.6 0)" d="M8 5.2v13.6a1 1 0 0 0 1.5.9l11-6.8a1 1 0 0 0 0-1.8l-11-6.8A1 1 0 0 0 8 5.2Z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="currentColor"/></svg>',
  vol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.4l4.6 3.8V5.7L7.4 9.5H4Z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mute:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.4l4.6 3.8V5.7L7.4 9.5H4Z" fill="currentColor"/><path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  fs:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fsx:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  replay:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.2-5.1M5 4.5v4h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const CSS=`live-player{display:block}
.lp{--lp-cream:#F7F2E8;--lp-teal:#317C8E;--lp-ink:#141414;--lp-red:#E5484D;position:relative;width:100%;font-family:var(--sans,"Manrope",system-ui,sans-serif);color:var(--lp-cream)}
.lp-box{position:relative}
.lp-box:fullscreen{display:flex;flex-direction:column;justify-content:center;background:#000;width:100vw;height:100vh}
.lp-box:fullscreen .lp-stage{border-radius:0;aspect-ratio:auto;flex:1}
.lp-stage{position:relative;aspect-ratio:16/9;border-radius:20px;overflow:hidden;background:#141414;isolation:isolate}
/* плеєр YouTube більший за кадр: його власні плашки (назва зверху, «Інші відео» й лого знизу) лишаються за краєм і обрізаються;
   саме відео підганяється по ширині, тож у кадрі не зсувається й не змінює розмір */
.lp-yt{position:absolute;left:0;right:0;top:-130px;bottom:-130px}
.lp-yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.lp-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;opacity:1;transition:opacity .7s ease;pointer-events:none}
.lp[data-started] .lp-poster{opacity:0}
.lp-hit{position:absolute;inset:0;z-index:2;border:0;padding:0;background:transparent;cursor:pointer}
.lp-hit:focus-visible{outline:3px solid var(--lp-cream);outline-offset:-6px}
.lp-load{position:absolute;inset:0;z-index:2;display:grid;place-items:center;pointer-events:none;transition:opacity .4s ease}
.lp-load i{width:42px;height:42px;border-radius:50%;border:3px solid rgba(247,242,232,.25);border-top-color:var(--lp-cream);animation:lpspin 1s linear infinite}
.lp[data-started] .lp-load,.lp[data-mode="error"] .lp-load{opacity:0}
@keyframes lpspin{to{rotate:360deg}}
.lp-err{position:absolute;inset:0;z-index:3;display:none;place-content:center;justify-items:center;gap:16px;text-align:center;padding:24px;background:#141414}
.lp[data-mode="error"] .lp-err{display:grid}
.lp-err p{margin:0;font-weight:600;font-size:var(--t1-size);letter-spacing:-.02em}
.lp-err a{display:inline-flex;align-items:center;height:48px;padding:0 28px;border-radius:12px;background:var(--lp-cream);color:var(--lp-ink);text-decoration:none;font:800 var(--t3-size)/1 inherit;letter-spacing:.04em;text-transform:uppercase}
/* кнопки */
.lp-btn{flex:none;display:grid;place-items:center;width:46px;height:46px;border:0;border-radius:50%;padding:0;cursor:pointer;background:var(--lp-cream);color:var(--lp-ink);
  transition:scale .3s cubic-bezier(.2,.7,.2,1),background .25s ease,color .25s ease}
.lp-btn svg{width:22px;height:22px;display:block}
.lp-btn>span{line-height:0}
.lp-ico-play,.lp-ico-vol,.lp-ico-fs{display:block}
.lp-btn:hover{scale:1.08}
.lp-btn:focus-visible{outline:2px solid var(--lp-cream);outline-offset:3px}
.lp-btn[hidden]{display:none}
.lp-ico-pause,.lp-ico-fsx{display:none}
.lp[data-playing] .lp-ico-play,.lp[data-fs] .lp-ico-fs{display:none}
.lp[data-playing] .lp-ico-pause,.lp[data-fs] .lp-ico-fsx{display:block}
.lp-ico-mute{display:none}.lp[data-muted] .lp-ico-mute{display:block}.lp[data-muted] .lp-ico-vol{display:none}
.lp-bar{position:absolute;left:0;right:0;bottom:0;z-index:4;display:flex;align-items:center;gap:12px;padding:44px 20px 18px;
  background:linear-gradient(to top,rgba(20,17,15,.72),rgba(20,17,15,0));transition:opacity .4s ease,translate .4s ease}
.lp[data-bidle][data-playing] .lp-bar{opacity:0;translate:0 8px;pointer-events:none}   /* панель кнопок: ховається через 5 с без руху курсора */
.lp[data-idle][data-playing] .lp-hit{cursor:none}
.lp-prog{flex:1;min-width:0;display:flex;align-items:center;gap:12px}
.lp[data-mode="live"] .lp-prog{display:none}
.lp-time{flex:none;font-weight:700;font-size:13px;letter-spacing:.02em;font-variant-numeric:tabular-nums;color:var(--lp-cream);min-width:92px;text-align:right}
.lp-range{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:22px;margin:0;background:transparent;cursor:pointer;--p:0%}
.lp-range::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:linear-gradient(to right,var(--lp-cream) var(--p),rgba(247,242,232,.3) var(--p))}
.lp-range::-moz-range-track{height:4px;border-radius:4px;background:rgba(247,242,232,.3)}
.lp-range::-moz-range-progress{height:4px;border-radius:4px;background:var(--lp-cream)}
.lp-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-5px;border-radius:50%;background:var(--lp-cream);border:0;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.lp-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--lp-cream);border:0}
.lp-range:focus-visible{outline:2px solid var(--lp-cream);outline-offset:2px;border-radius:6px}
.lp-live{display:none;align-items:center;gap:8px;margin-right:auto;height:34px;padding:0 14px;border-radius:999px;background:rgba(20,17,15,.55);font-weight:800;font-size:var(--t3-size);letter-spacing:.06em;text-transform:uppercase;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.lp-live::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--lp-red);animation:lppulse 1.6s ease-in-out infinite}
.lp[data-mode="live"] .lp-live{display:inline-flex}
@keyframes lppulse{50%{scale:1.5;opacity:.6}}
.lp-unmute{position:absolute;left:20px;top:20px;z-index:5;display:none;align-items:center;gap:10px;height:46px;padding:0 20px 0 14px;border:0;border-radius:999px;cursor:pointer;background:var(--lp-cream);color:var(--lp-ink);
  font:800 var(--t3-size)/1 inherit;letter-spacing:.04em;text-transform:uppercase;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:scale .3s cubic-bezier(.2,.7,.2,1)}
.lp-unmute svg{width:22px;height:22px}
.lp-unmute:hover{scale:1.04}
.lp-unmute:focus-visible{outline:2px solid var(--lp-cream);outline-offset:3px}
.lp[data-started] .lp-unmute{display:inline-flex}
.lp-unmute .u-on,.lp-unmute .u-off{display:inline-flex;align-items:center;gap:10px}
.lp-unmute .u-off{display:none}.lp[data-muted] .lp-unmute .u-on{display:none}.lp[data-muted] .lp-unmute .u-off{display:inline-flex}
.lp-unmute{transition:scale .3s cubic-bezier(.2,.7,.2,1),opacity .5s ease,translate .5s cubic-bezier(.2,.7,.2,1)}
.lp[data-idle][data-playing]:not([data-muted]) .lp-unmute{opacity:0;translate:0 -8px;pointer-events:none}
.lp-big{position:absolute;left:50%;top:50%;z-index:3;width:92px;height:92px;margin:-46px 0 0 -46px;border:0;border-radius:50%;display:none;place-items:center;background:var(--lp-cream);color:var(--lp-ink);cursor:pointer;box-shadow:0 14px 40px rgba(0,0,0,.4);transition:scale .3s cubic-bezier(.2,.7,.2,1)}
.lp-big svg{width:36px;height:36px}
.lp-big:hover{scale:1.06}
.lp:not([data-playing]):not([data-loading]) .lp-big{display:grid}
/* підпис */
.lp-cap{color:var(--lp-cap,#141414);display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px 24px;padding:20px 4px 0}
.lp-cap-l{display:flex;align-items:center;flex-wrap:wrap;gap:10px 16px}
.lp-cap h2{margin:0;font-weight:500;font-size:clamp(26px,2.8vw,40px);line-height:1.1;letter-spacing:-.04em}
.lp-tag{display:inline-flex;align-items:center;height:30px;padding:0 14px;border-radius:999px;background:rgba(20,20,20,.07);font-weight:700;font-size:var(--t3-size);letter-spacing:.04em;text-transform:uppercase}
.lp[data-mode="live"] .lp-tag,.lp[data-mode="loading"] .lp-tag{display:none}
.lp-dot{display:none;width:12px;height:12px;border-radius:50%;background:var(--lp-red);animation:lppulse 1.6s ease-in-out infinite}
.lp[data-mode="live"] .lp-dot{display:inline-block}
.lp-date{font-weight:600;font-size:clamp(17px,1.6vw,22px);letter-spacing:-.025em;opacity:.7;text-transform:none}
/* підпис на самому відео: з'являється, коли навели курсор / пауза / перші секунди, і плавно зникає */
.lp[data-cap="ov"] .lp-cap{position:absolute;left:0;right:0;bottom:0;z-index:4;display:grid;justify-content:start;gap:8px;padding:90px 32px 30px;color:var(--lp-cream);pointer-events:none;
  background:linear-gradient(to top,rgba(20,17,15,.78),rgba(20,17,15,.4) 55%,rgba(20,17,15,0));opacity:0;transition:opacity .6s cubic-bezier(.4,0,.2,1)}
.lp[data-cap="ov"] .lp-cap-l,.lp[data-cap="ov"] .lp-date{opacity:0;translate:0 14px;transition:opacity .45s ease,translate .55s cubic-bezier(.2,.7,.2,1)}
.lp[data-cap="ov"] .lp-cap h2{font-size:clamp(30px,3.6vw,54px);letter-spacing:-.05em}
.lp[data-cap="ov"] .lp-date{opacity:0;font-size:clamp(16px,1.5vw,22px);color:var(--lp-cream)}
.lp[data-cap="ov"] .lp-tag{background:rgba(247,242,232,.2);color:var(--lp-cream)}
.lp[data-cap="ov"]:not([data-idle]) .lp-cap,.lp[data-cap="ov"]:not([data-playing]) .lp-cap{opacity:1}
.lp[data-cap="ov"]:not([data-idle]) .lp-cap-l,.lp[data-cap="ov"]:not([data-playing]) .lp-cap-l{opacity:1;translate:0 0;transition-delay:.12s}
.lp[data-cap="ov"]:not([data-idle]) .lp-date,.lp[data-cap="ov"]:not([data-playing]) .lp-date{opacity:.8;translate:0 0;transition-delay:.26s}
.lp[data-cap="ov"][data-fs] .lp-cap{padding-inline:48px}
/* вигляд A: кнопки поверх відео */
.lp[data-variant="a"] .lp-btn{background:var(--lp-cream)}
/* вигляд B: панель кнопок під відео, окремим блоком */
.lp[data-variant="b"] .lp-bar{position:static;margin-top:10px;padding:10px 14px;border-radius:18px;background:rgba(247,242,232,.08);}
.lp[data-variant="b"] .lp-btn{width:44px;height:44px;background:rgba(247,242,232,.14);color:var(--lp-cream)}
.lp[data-variant="b"] .lp-btn:hover{background:var(--lp-cream);color:var(--lp-ink)}
.lp[data-variant="b"] .lp-live{background:rgba(247,242,232,.1)}
.lp[data-variant="b"] .lp-range::-webkit-slider-runnable-track{background:linear-gradient(to right,var(--lp-teal) var(--p),rgba(247,242,232,.2) var(--p))}
.lp[data-variant="b"] .lp-range::-moz-range-progress{background:var(--lp-teal)}
.lp[data-variant="b"] .lp-range::-webkit-slider-thumb{background:var(--lp-cream)}
.lp[data-variant="b"] .lp-big{display:none!important}
/* вигляд C: мінімум — велика кнопка по центру, дрібні іконки в куті, тонка лінія часу по нижньому краю */
.lp[data-variant="c"] .lp-bar{padding:0 16px 22px;background:none;gap:8px;justify-content:flex-end}
.lp[data-variant="c"] .lp-btn{width:42px;height:42px;background:rgba(20,17,15,.55);color:var(--lp-cream);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.lp[data-variant="c"] .lp-btn:hover{background:var(--lp-cream);color:var(--lp-ink)}
.lp[data-variant="c"] .lp-prog{position:absolute;left:0;right:0;bottom:0;display:block}
.lp[data-variant="c"] .lp-time{display:none}
.lp[data-variant="c"] .lp-range{display:block;width:100%;height:14px}
.lp[data-variant="c"] .lp-range::-webkit-slider-runnable-track{height:3px;border-radius:0}
.lp[data-variant="c"] .lp-range::-webkit-slider-thumb{width:0;height:0;margin-top:0;box-shadow:none}
.lp[data-variant="c"] .lp-range::-moz-range-thumb{width:0;height:0}
.lp[data-variant="c"] #lp-pp{display:none}
.lp[data-variant="c"] .lp-live{margin-right:auto}
@media (max-width:720px){
  .lp-stage{border-radius:16px}
  .lp-bar{padding:34px 12px 12px;gap:8px}
  .lp-btn{width:40px;height:40px}.lp-btn svg{width:20px;height:20px}
  .lp-time{min-width:0;font-size:var(--t3-size)}
  .lp-unmute{left:12px;top:12px;height:40px;padding:0 16px 0 10px}
  .lp-big{width:72px;height:72px;margin:-36px 0 0 -36px}
  .lp-cap{padding-top:14px}
  .lp[data-cap="ov"] .lp-cap{padding:60px 16px 16px}
  .lp[data-variant="c"] .lp-bar{padding:0 10px 16px}
}
@media (prefers-reduced-motion:reduce){.lp[data-cap="ov"] .lp-cap,.lp[data-cap="ov"] .lp-cap-l,.lp[data-cap="ov"] .lp-date{transition:none}.lp-load i,.lp-live::before,.lp-dot{animation:none}.lp-poster{transition:none}}
`;
if(!document.getElementById("live-player-css")){
  const st=document.createElement("style");st.id="live-player-css";st.textContent=CSS;document.head.appendChild(st);
}

let apiP=null;
const loadAPI=()=>apiP||(apiP=new Promise((ok,no)=>{
  if(window.YT&&window.YT.Player)return ok();
  const prev=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{prev&&prev();ok()};
  const s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";s.onerror=no;document.head.appendChild(s);
  setTimeout(()=>{if(!(window.YT&&window.YT.Player))no()},12000);
}));

const fmtDate=d=>new Intl.DateTimeFormat("uk-UA",{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Kyiv"}).format(d).replace(/\s?р\.$/,"");
const fmtTime=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,p=n=>String(n).padStart(2,"0");return(h?h+":"+p(m):m)+":"+p(x)};

class LivePlayer extends HTMLElement{
  connectedCallback(){
    if(this._ready)return;this._ready=true;
    const v=this.getAttribute("variant")||"a";
    const ov=this.getAttribute("caption")==="overlay";          // підпис на самому відео (знизу зліва), а не під ним
    const CAP=`<div class="lp-cap">
        <div class="lp-cap-l"><span class="lp-dot" aria-hidden="true"></span><h2>LIVE трансляція</h2><span class="lp-tag">Трансляція відбулась</span></div>
        <time class="lp-date"></time>
      </div>`;
    this.innerHTML=`<div class="lp" data-variant="${v}" data-mode="loading" data-loading${ov?' data-cap="ov"':""}>
      <div class="lp-box">
        <div class="lp-stage">
          <img class="lp-poster" alt="" hidden>
          <div class="lp-yt"></div>
          <div class="lp-load"><i></i></div>
          <button class="lp-hit" type="button" aria-label="Пауза або відтворення"></button>
          <button class="lp-big" type="button" aria-label="Відтворити">${I.play}</button>
          <button class="lp-unmute" type="button"><span class="u-on">${I.vol}Вимкнути звук</span><span class="u-off">${I.mute}Увімкнути звук</span></button>
          <div class="lp-err"><p>Не вдалося завантажити трансляцію</p><a href="${CHANNEL_URL}" target="_blank" rel="noopener">Відкрити на YouTube</a></div>
          ${ov?CAP:""}
          ${v==="b"?"":"%BAR%"}
        </div>
        ${v==="b"?"%BAR%":""}
      </div>
      ${ov?"":CAP}
    </div>`.replace(/%BAR%/g,`<div class="lp-bar">
            <span class="lp-live">Наживо</span>
            <button class="lp-btn" id="lp-pp" type="button" aria-label="Пауза або відтворення"><span class="lp-ico-play">${I.play}</span><span class="lp-ico-pause">${I.pause}</span></button>
            <div class="lp-prog"><input class="lp-range" type="range" min="0" max="1000" value="0" aria-label="Перемотування"><span class="lp-time">0:00 / 0:00</span></div>
            <button class="lp-btn lp-mutebtn" type="button" aria-label="Звук"><span class="lp-ico-vol">${I.vol}</span><span class="lp-ico-mute">${I.mute}</span></button>
            <button class="lp-btn lp-fsbtn" type="button" aria-label="На весь екран"><span class="lp-ico-fs">${I.fs}</span><span class="lp-ico-fsx">${I.fsx}</span></button>
          </div>`);
    const q=s=>this.querySelector(s);
    this.lp=q(".lp");this.box=q(".lp-box");this.host=q(".lp-yt");this.poster=q(".lp-poster");this.range=q(".lp-range");this.time=q(".lp-time");this.dateEl=q(".lp-date");
    this.bind();
    this.setDate(new Date());
    this.start();
  }
  setMode(m){this.lp.dataset.mode=m;this.dispatchEvent(new CustomEvent("lp:mode",{detail:m,bubbles:true}))}
  setDate(d){this.dateEl.textContent=fmtDate(d);this.dateEl.dateTime=d.toISOString()}
  flag(name,on){on?this.lp.setAttribute("data-"+name,""):this.lp.removeAttribute("data-"+name)}
  async start(){
    let data=null;
    try{const r=await fetch(BASE+"live/latest.json",{cache:"no-store"});if(r.ok)data=await r.json()}catch(e){}
    this.data=data&&data.id?data:FALLBACK;
    if(data&&data.thumb){this.poster.src=BASE+data.thumb;this.poster.hidden=false}
    else if(this.data.id){this.poster.src=`https://i.ytimg.com/vi/${this.data.id}/hqdefault.jpg`;this.poster.hidden=false}
    try{await loadAPI()}catch(e){this.setMode("error");return}
    this.tryLive();
  }
  playerVarsStr(){return PV+"&enablejsapi=1&origin="+encodeURIComponent(location.origin)}
  tryLive(){
    this.host.innerHTML="";
    const f=document.createElement("iframe");
    f.src=`https://www.youtube.com/embed/live_stream?channel=${CHANNEL}&${this.playerVarsStr()}`;
    f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.title="LIVE трансляція";
    this.host.appendChild(f);
    let done=false;
    const toPast=()=>{if(done)return;done=true;clearTimeout(t);this.showPast()};
    const isLive=()=>{if(done)return;done=true;clearTimeout(t);this.setMode("live");this.setDate(new Date())};
    const t=setTimeout(toPast,LIVE_WAIT);
    this.yt=new YT.Player(f,{events:{
      onReady:e=>this.onReady(e),
      onError:toPast,                                           // 150 / 100 / 101: ефіру немає
      onStateChange:e=>{if(e.data===1||e.data===3)isLive();this.onState(e)}}});
  }
  showPast(){
    try{this.yt&&this.yt.destroy()}catch(e){}
    this.host.innerHTML='<div id="lp-'+Math.random().toString(36).slice(2,8)+'"></div>';
    clearTimeout(this._fb);this.flag("started",false);this.flag("playing",false);this.flag("loading",true);
    this.setMode("past");
    if(this.data.startedAt)this.setDate(new Date(this.data.startedAt));
    this.yt=new YT.Player(this.host.firstChild,{width:"100%",height:"100%",videoId:this.data.id,
      playerVars:{autoplay:1,mute:0,controls:0,rel:0,modestbranding:1,playsinline:1,iv_load_policy:3,disablekb:1,fs:0,cc_load_policy:0,origin:location.origin},
      events:{onReady:e=>this.onReady(e),onStateChange:e=>this.onState(e),onError:()=>this.setMode("error")}});
  }
  onReady(e){
    try{e.target.unMute();e.target.playVideo()}catch(x){}
    this.flag("muted",false);
    // браузер може заборонити автозапуск зі звуком: тоді стартуємо без звуку, кнопка зверху пропонує його увімкнути
    clearTimeout(this._fb);
    let tries=0;
    const check=()=>{
      if(this.lp.hasAttribute("data-playing")||this.lp.dataset.mode==="error")return;
      let st=-1;try{st=this.yt.getPlayerState()}catch(x){}
      if(st===3&&tries++<2){this._fb=setTimeout(check,1500);return}
      try{this.yt.mute();this.yt.playVideo()}catch(x){}
      this.flag("muted",true);
    };
    this._fb=setTimeout(check,2400);
  }
  onState(e){
    const s=e.data;
    if(s===1){this.flag("playing",true);this.flag("started",true);this.flag("loading",false);this.flag("ended",false);this.tick(true)}
    else if(s===2){this.flag("playing",false)}
    else if(s===0){this.flag("playing",false);this.flag("ended",true);this.flag("started",false)}
    else if(s===3){this.flag("loading",false)}
    this.syncMute();
  }
  syncMute(){try{this.flag("muted",this.yt.isMuted())}catch(e){}}
  tick(on){
    clearInterval(this._tk);
    if(!on)return;
    const step=()=>{
      try{
        if(this.lp.dataset.mode!=="past")return;
        const d=this.yt.getDuration(),c=this.yt.getCurrentTime();
        if(d>0&&!this._drag){const p=Math.min(1000,Math.round(c/d*1000));this.range.value=p;this.range.style.setProperty("--p",(p/10)+"%")}
        this.time.textContent=fmtTime(c)+" / "+fmtTime(d);
      }catch(e){}
    };
    step();this._tk=setInterval(step,500);
  }
  toggle(){
    if(!this.yt||!this.yt.getPlayerState)return;
    const s=this.yt.getPlayerState();
    if(s===1||s===3){this.yt.pauseVideo()}
    else if(s===0){this.yt.seekTo(0,true);this.yt.playVideo()}
    else this.yt.playVideo();
  }
  unmute(){try{this.yt.unMute();this.yt.setVolume(100)}catch(e){}this.flag("muted",false)}   // YouTube відповідає із затримкою, тому стан ставимо одразу
  toggleMute(){if(this.lp.hasAttribute("data-muted"))this.unmute();else{try{this.yt.mute()}catch(e){}this.flag("muted",true)}}
  fullscreen(){
    const el=this.box;
    if(document.fullscreenElement){document.exitFullscreen();return}
    (el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el);
  }
  bind(){
    const q=s=>this.querySelector(s);
    q(".lp-hit").addEventListener("click",()=>this.toggle());
    q(".lp-big").addEventListener("click",()=>this.toggle());
    q("#lp-pp").addEventListener("click",()=>this.toggle());
    q(".lp-unmute").addEventListener("click",()=>this.toggleMute());
    q(".lp-mutebtn").addEventListener("click",()=>this.toggleMute());
    const fsb=q(".lp-fsbtn");
    if(!(document.fullscreenEnabled||document.webkitFullscreenEnabled))fsb.hidden=true;
    fsb.addEventListener("click",()=>this.fullscreen());
    document.addEventListener("fullscreenchange",()=>this.flag("fs",document.fullscreenElement===this.box));
    this.range.addEventListener("input",()=>{
      this._drag=true;const p=this.range.value/10;this.range.style.setProperty("--p",p+"%");
      try{const d=this.yt.getDuration();this.time.textContent=fmtTime(d*p/100)+" / "+fmtTime(d)}catch(e){}
    });
    this.range.addEventListener("change",()=>{
      try{this.yt.seekTo(this.yt.getDuration()*this.range.value/1000,true);this.yt.playVideo()}catch(e){}
      this._drag=false;
    });
    // панель ховається, коли відео грає й курсор нерухомий
    let t,tb;
    const wake=()=>{
      this.flag("idle",false);clearTimeout(t);t=setTimeout(()=>this.flag("idle",true),2000);           // підпис і кнопка звуку — 2 с
      this.flag("bidle",false);clearTimeout(tb);tb=setTimeout(()=>this.flag("bidle",true),5000);       // панель кнопок — 5 с
    };
    ["mousemove","touchstart","keydown","focusin"].forEach(ev=>this.lp.addEventListener(ev,wake,{passive:true}));
    this.lp.addEventListener("mouseleave",()=>{clearTimeout(t);t=setTimeout(()=>this.flag("idle",true),2000)});   // курсор пішов — через 2 с підпис і кнопки ховаються
    wake();                                                       // на старті підпис і кнопки видно кілька секунд
    this.lp.addEventListener("keydown",e=>{
      if(e.key===" "&&e.target.closest(".lp-hit,.lp-box")&&e.target.tagName!=="INPUT"){e.preventDefault();this.toggle()}
    });
    // вкладка прихована — не тримаємо таймер
    document.addEventListener("visibilitychange",()=>{if(document.hidden)clearInterval(this._tk);else if(this.lp.hasAttribute("data-playing"))this.tick(true)});
  }
}
if(!customElements.get("live-player"))customElements.define("live-player",LivePlayer);
})();
