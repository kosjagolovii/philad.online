/* =====================================================================
   <home-groups> — блок «Домашні групи» (карта + список + картка групи).
   Один компонент для всього сайту: дані з groups/data.js (єдина база),
   правки з groups/edits.json і спільної бази артефакту накладаються всюди.

   Атрибути:
     title="Молодіжні домашки"  — заголовок панелі (за замовчуванням «Домашні групи»)
     who="young"                — фільтр «Для кого» при відкритті (young · mid1 · mid2 · old · mamy · online)
     open-first                 — одразу відкрити першу групу списку
     editable                   — правки текстів із тюнера сторінки (лише homegroups.html)
   Підключення:  <script src="components/groups.js"></script>  і  <home-groups></home-groups>
   ===================================================================== */
(()=>{
const CSS=`/* Блок «Домашні групи» — спільний компонент. Стилі живуть тут, а не на сторінках. */
home-groups{display:block;--ds-cream:#F7F2E8;--ink:#141414;--mute:#85837E;--teal:#317C8E;--teal-ink:#28697A;--sand:#E8E7DB;--grey:#9A9A8D;
  --sans:"Manrope",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-family:var(--sans)}
home-groups button{font:inherit;color:inherit}
home-groups img{max-width:100%;display:block}
/* ---------- map block ---------- */
.hg-map{position:relative;height:clamp(640px,90svh,860px);border-radius:20px;overflow:hidden;background:#292929;isolation:isolate}
.hg-canvas{position:absolute;inset:0;overflow:hidden}
/* static picture (works everywhere) — the live map fades in over it */
.hg-static{position:absolute;left:0;top:0;width:1049px;height:822.5px;max-width:none;transform-origin:0 0;user-select:none;-webkit-user-drag:none;will-change:transform}
.hg-canvas{background:#292929;touch-action:none}
.hg-map.live .hg-canvas{touch-action:auto}
.hg-live{position:absolute;inset:0;opacity:0;transition:opacity .8s ease;background:#1b1d1f}
.hg-map.live .hg-live{opacity:1}
.hg-map .hg-live.maplibregl-map{position:absolute}
.hg-map.live .hg-static,.hg-map.live .hg-dots{visibility:hidden}
.hg-live .maplibregl-canvas{outline:none}
.hg-live .maplibregl-ctrl-attrib{background:rgba(20,20,20,.55)!important;color:rgba(247,242,232,.6);font:500 10px/1.4 var(--sans)}
.hg-live .maplibregl-ctrl-attrib a{color:inherit}
.hg-live .maplibregl-cooperative-gesture-screen{background:rgba(20,20,20,.55);color:var(--ds-cream);font:600 16px/1.4 var(--sans);padding:20px;text-align:center;display:flex;align-items:center;justify-content:center}
.hg-dots{position:absolute;inset:0;pointer-events:none}
.hg-dots .hg-dot{position:absolute;pointer-events:auto;margin:-22px 0 0 -22px}

/* group dots (static and live map share the same element).
   The button itself is never scaled or moved by CSS: the map positions it with a transform,
   and a CSS scale on it would scale that offset too and push the dot off its address. All visuals live on the inner <i>. */
.hg-dot{width:44px;height:44px;padding:0;border:0;background:none;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
.hg-dot i{box-sizing:border-box;width:30px;height:30px;display:grid;place-items:center;border:4px solid var(--ds-cream);border-radius:15px;background:var(--ink);color:var(--ds-cream);
  font:800 var(--t3-size)/1 var(--sans);font-style:normal;box-shadow:0 6px 16px rgba(0,0,0,.35);transition:scale .3s cubic-bezier(.2,.7,.2,1),background .25s ease,border-width .25s ease}
.hg-dot.many i{width:auto;min-width:38px;height:38px;padding:0 8px;border-radius:19px}
.hg-dot:hover i{scale:1.15}
.hg-dot:focus-visible{outline:none}
.hg-dot:focus-visible i{outline:2px solid var(--ds-cream);outline-offset:3px}
.hg-dot.on i{background:var(--teal);border-width:5px;scale:1.35}
.hg-dot[hidden]{display:none}
.hg-dot.off{opacity:.25;transition:opacity .3s ease}
.hg-dot.many{z-index:1}
.hg-dot.on{z-index:2}

/* left panel */
.hg-panel{position:absolute;left:32px;top:32px;bottom:32px;z-index:3;width:440px;box-sizing:border-box;display:flex;flex-direction:column;gap:24px;padding:32px;border-radius:20px;background:var(--ink);color:var(--ds-cream)}
.hg-panel h2{margin:0;font:var(--h2s-weight) var(--h2s-size)/var(--h2s-lh) var(--font);letter-spacing:var(--h2s-track)}
.hg-tools{display:grid;gap:16px}
.hg-search{display:block;position:relative}
.hg-search input{width:100%;height:56px;box-sizing:border-box;padding:0 24px;border:0;border-radius:15px;background:rgba(247,242,232,.1);color:var(--ds-cream);
  font:600 var(--t2-size)/1 var(--sans);letter-spacing:-.057em;outline:none;transition:background .2s ease,box-shadow .2s ease}
@media (max-width:900px){.hg-search input{font-size:16px}}   /* iOS не збільшує сторінку при фокусі */
.hg-search input::placeholder{color:rgba(247,242,232,.55)}
.hg-search input:focus{background:rgba(247,242,232,.14);box-shadow:inset 0 0 0 1px rgba(247,242,232,.35)}
.hg-chips{display:flex;flex-wrap:wrap;gap:10px;position:relative}
.hg-chip{height:44px;padding:0 18px;border:0;border-radius:10px;background:rgba(247,242,232,.1);color:rgba(247,242,232,.8);font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);cursor:pointer;transition:background .2s ease,color .2s ease}
.hg-chip:hover{background:rgba(247,242,232,.16);color:var(--ds-cream)}
.hg-chip[aria-pressed="true"],.hg-chip.set{background:var(--teal);color:var(--ds-cream)}
.hg-chip:focus-visible{outline:2px solid var(--ds-cream);outline-offset:2px}
.hg-chip .car{display:inline-block;margin-left:4px;transition:rotate .25s ease}
.hg-chip[aria-expanded="true"] .car{rotate:180deg}
.hg-menu{position:absolute;left:0;top:52px;z-index:5;min-width:220px;display:grid;padding:6px;border-radius:14px;background:#262626;box-shadow:0 18px 40px rgba(0,0,0,.45)}
.hg-menu[hidden]{display:none}
.hg-menu button{display:flex;justify-content:space-between;gap:16px;padding:11px 12px;border:0;border-radius:9px;background:none;color:rgba(247,242,232,.85);font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);text-align:left;cursor:pointer}
.hg-menu button:hover,.hg-menu button:focus-visible{background:rgba(247,242,232,.08);color:var(--ds-cream);outline:none}
.hg-menu button[aria-checked="true"]{color:var(--ds-cream)}
.hg-menu button[aria-checked="true"]::after{content:"✓";color:#7FC4D3}
.hg-count{margin:0;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:var(--grey)}
.hg-list{flex:1;min-height:0;margin:-4px -12px -32px;padding:4px 12px 32px;overflow-y:auto;overscroll-behavior:contain;display:grid;align-content:start;gap:8px;list-style:none;
  scrollbar-width:thin;scrollbar-color:rgba(247,242,232,.2) transparent;-webkit-mask:linear-gradient(#000 calc(100% - 40px),transparent)}
.hg-card{width:100%;display:flex;gap:12px;align-items:center;padding:16px 20px;border:0;border-radius:15px;background:rgba(247,242,232,.08);text-align:left;cursor:pointer;
  transition:background .25s ease,transform .35s cubic-bezier(.2,.7,.2,1)}
.hg-card:hover{background:rgba(247,242,232,.13)}
.hg-card:focus-visible{outline:2px solid var(--ds-cream);outline-offset:2px}
.hg-card[aria-current="true"]{background:var(--teal);padding-block:20px}
.hg-ava{flex:none;width:64px;height:64px;border-radius:12px;overflow:hidden;background:#2b2b2b;display:grid;place-items:center;font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font);letter-spacing:var(--h3-track);color:rgba(247,242,232,.6)}
.hg-ava img{width:100%;height:100%;object-fit:cover}
.hg-txt{display:grid;gap:6px;min-width:0}
.hg-name{font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font);letter-spacing:var(--h3-track);color:var(--ds-cream);text-wrap:balance}
.hg-meta{font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:var(--grey)}
.hg-card[aria-current="true"] .hg-meta{color:rgba(247,242,232,.75)}
.hg-empty{padding:24px 4px;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:var(--grey)}
.hg-empty button{padding:0;border:0;background:none;color:var(--ds-cream);font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}

/* right: the selected group */
.hg-detail{position:absolute;right:32px;top:32px;z-index:5;width:320px;box-sizing:border-box;display:grid;gap:12px;padding:20px;border-radius:20px;background:var(--ds-cream);color:var(--ink);
  box-shadow:0 24px 60px rgba(0,0,0,.35);transition:opacity .35s ease,translate .5s cubic-bezier(.2,.7,.2,1)}
.hg-detail[hidden]{display:grid;opacity:0;translate:24px 0;pointer-events:none;visibility:hidden;transition:opacity .25s ease,translate .3s ease,visibility 0s .3s}
.hg-photo{position:relative;height:190px;border-radius:12px;overflow:hidden;background:var(--sand)}
.hg-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.hg-photo .hg-initials{position:absolute;inset:0;display:grid;place-items:center;font:var(--d1-weight) var(--d1-size)/var(--d1-lh) var(--font);letter-spacing:var(--d1-track);color:var(--grey)}
.hg-detail h3{margin:4px 0 0;font:var(--h2s-weight) var(--h2s-size)/var(--h2s-lh) var(--font);letter-spacing:var(--h2s-track);text-wrap:balance}
.hg-sub{margin:-6px 0 0;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:var(--teal)}
.hg-facts{margin:0;display:grid;gap:2px;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:rgba(20,20,20,.5)}
.hg-facts div{display:flex;gap:4px}
.hg-facts dt{flex:none}
.hg-facts dd{margin:0;color:rgba(20,20,20,.72)}
.hg-note{margin:0;padding:10px 12px;border-radius:10px;background:var(--sand);font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:rgba(20,20,20,.7)}
.hg-acts{display:grid;gap:10px;margin-top:4px}
.hg-btn{display:grid;place-items:center;height:48px;border-radius:12px;background:var(--teal);color:var(--ds-cream);font:var(--t3-weight) var(--t3-size)/var(--t3-lh) var(--font);letter-spacing:var(--t3-track);text-transform:uppercase;text-decoration:none;transition:background .25s ease,scale .3s cubic-bezier(.2,.7,.2,1)}
.hg-btn:hover{background:var(--teal-ink)}
.hg-btn.alt{background:var(--sand);color:var(--ink)}
.hg-btn.alt:hover{background:#dcdbcd}
.hg-btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.hg-btn[hidden]{display:none}
.hg-close{position:absolute;right:12px;top:12px;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,.12);transition:scale .3s cubic-bezier(.2,.7,.2,1)}
.hg-close:hover{scale:1.08}
.hg-close:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.hg-close::before,.hg-close::after{content:"";position:absolute;width:16px;height:2px;border-radius:2px;background:#000;rotate:45deg}
.hg-close::after{rotate:-45deg}

/* zoom buttons */
.hg-ctrl{position:absolute;right:32px;bottom:32px;z-index:2;display:grid;gap:8px}
.hg-ctrl button{width:44px;height:44px;display:grid;place-items:center;padding:0;border:0;border-radius:12px;background:var(--ds-cream);color:var(--ink);cursor:pointer;font:600 22px/1 var(--sans);
  transition:scale .3s cubic-bezier(.2,.7,.2,1),background .2s ease}
.hg-ctrl button:hover{scale:1.06;background:#fff}
.hg-ctrl button:focus-visible{outline:2px solid var(--ds-cream);outline-offset:3px}
.hg-ctrl svg{width:18px;height:18px}
.hg-live .maplibregl-ctrl-bottom-right{right:84px}

@media (max-width:1100px){
  .hg-panel{width:380px;padding:24px}
  .hg-detail{width:290px}
  .hg-photo{height:170px}
}
/* tablet & phone: map on top, list below it, the selected group opens as a sheet over the map */
@media (max-width:860px){
  .hg-map{height:auto;display:flex;flex-direction:column;background:var(--ink)}
  .hg-canvas{position:relative;inset:auto;height:62svh;min-height:380px}
  .hg-panel{position:relative;left:auto;top:auto;bottom:auto;width:auto;border-radius:0;max-height:none;padding:28px 20px 24px}
  .hg-panel h2{font-size:var(--h2s-size)}
  .hg-list{max-height:62svh;margin-bottom:-24px;padding-bottom:28px}
  .hg-detail{left:12px;right:12px;top:auto;bottom:12px;width:auto;grid-template-columns:120px minmax(0,1fr);column-gap:14px;align-items:start;padding:14px}
  .hg-detail[hidden]{translate:0 24px}
  .hg-photo{grid-row:span 3;height:120px}
  .hg-detail h3{font-size:var(--h3-size);margin:0;padding-right:40px}
  .hg-sub{margin:0}
  .hg-facts{grid-column:1/-1}
  .hg-note{grid-column:1/-1}
  .hg-acts{grid-column:1/-1;grid-template-columns:1fr 1fr}
  .hg-ctrl{right:12px;bottom:auto;top:12px}
  .hg-live .maplibregl-ctrl-bottom-right{right:0}
}
@media (max-width:720px){
  .hg-map{border-radius:16px}
  .hg-name{font-size:var(--t1-size)}
  .hg-ava{width:56px;height:56px}
  .hg-card{padding:16px 16px}
  .hg-card[aria-current="true"]{padding-block:16px}
}
@media (max-width:420px){
  .hg-detail{grid-template-columns:96px minmax(0,1fr)}
  .hg-photo{height:96px}
}
@media (prefers-reduced-motion:reduce){.hg-static,.hg-detail,.hg-card,.hg-dot,.hg-dot i{transition:none!important}}

/* edit mode: every text of the selected group can be typed over in place */
.hg-editing .hg-detail{box-shadow:0 0 0 2px var(--teal),0 24px 60px rgba(0,0,0,.35)}
.hg-editing .hg-detail [data-f]{border-radius:4px;outline:1px dashed rgba(49,124,142,.55);outline-offset:2px;cursor:text;min-width:2ch;display:inline-block}
.hg-editing .hg-detail [data-f]:hover{background:rgba(49,124,142,.08)}
.hg-editing .hg-detail [data-f]:focus{outline:2px solid var(--teal);background:#fff}
.hg-editing .hg-detail [data-f].dirty{background:rgba(95,212,255,.18)}
.hg-editing .hg-detail [data-f]:empty::before{content:"—";color:rgba(20,20,20,.3)}
.hg-editing .hg-facts div{align-items:baseline}
.hg-editing .hg-facts dd{flex:1}
.hg-editing .hg-detail{max-height:calc(100% - 64px);overflow:auto}
.hg-editing .hg-card.edited .hg-name::after{content:"";display:inline-block;width:7px;height:7px;margin-left:8px;border-radius:50%;background:#5FD4FF;vertical-align:middle}
.hg-editbar{display:none}
.hg-editing .hg-editbar{display:block;margin:-4px 0 0;font:var(--t3-weight) var(--t3-size)/var(--t3-lh) var(--font);letter-spacing:var(--t3-track);color:var(--teal)}
@media (max-width:860px){.hg-editing .hg-detail{max-height:none}}`;
const TPL=`  <section class="hg-map" aria-label="Карта домашніх груп" data-dark>
    <div class="hg-canvas">
      <img class="hg-static" id="hgStatic" src="groups/kyiv.webp" alt="Карта Києва з розташуванням домашніх груп церкви «Філадельфія»" width="1049" height="823" draggable="false">
      <div class="hg-dots" id="hgDots"></div>
      <div class="hg-live" id="hgLive" aria-hidden="true"></div>
      <div class="hg-ctrl" role="group" aria-label="Керування картою">
        <button type="button" id="hgIn" aria-label="Наблизити">+</button>
        <button type="button" id="hgOut" aria-label="Віддалити">−</button>
        <button type="button" id="hgAll" aria-label="Показати всі групи"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>

      <article class="hg-detail" id="hgDetail" aria-live="polite" hidden>
        <div class="hg-photo" id="hgPhoto"></div>
        <p class="hg-editbar" id="hgEditbar">Режим редагування: клацніть на текст і виправте. Зберегти — у тюнері.</p>
        <h3 id="hgName"></h3>
        <p class="hg-sub" id="hgSub" hidden></p>
        <dl class="hg-facts" id="hgFacts"></dl>
        <p class="hg-note" id="hgNote" hidden></p>
        <div class="hg-acts">
          <a class="hg-btn" id="hgWrite" data-no-u href="#">Написати лідеру</a>
          <a class="hg-btn alt" id="hgMore" data-no-u href="#">Детальніше</a>
          <a class="hg-btn alt" id="hgRoute" data-no-u href="#" target="_blank" rel="noopener">Маршрут</a>
        </div>
        <button class="hg-close" type="button" id="hgClose" aria-label="Закрити картку групи"></button>
      </article>
    </div>

    <div class="hg-panel">
      <h2 id="hgTitle">Домашні групи</h2>
      <div class="hg-tools">
        <label class="hg-search">
          <input type="search" id="hgQ" placeholder="Метро, район або лідер" autocomplete="off" aria-label="Пошук: метро, район або лідер">
        </label>
        <div class="hg-chips">
          <button class="hg-chip" type="button" id="hgNear" aria-pressed="false">Поруч зі мною</button>
          <button class="hg-chip" type="button" id="hgWhoBtn" aria-expanded="false" aria-haspopup="true" aria-controls="hgWho"><span id="hgWhoL">Для кого</span><span class="car" aria-hidden="true">▾</span></button>
          <button class="hg-chip" type="button" id="hgDayBtn" aria-expanded="false" aria-haspopup="true" aria-controls="hgDay"><span id="hgDayL">День</span><span class="car" aria-hidden="true">▾</span></button>
          <div class="hg-menu" id="hgWho" role="menu" hidden></div>
          <div class="hg-menu" id="hgDay" role="menu" hidden></div>
        </div>
      </div>
      <p class="hg-count" id="hgCount" aria-live="polite"></p>
      <ul class="hg-list" id="hgList"></ul>
    </div>
  </section>`;
const DATA="groups/data.js";
const loadData=()=>new Promise((ok,no)=>{if(window.PHILAD_GROUPS)return ok();
  let s=document.querySelector(`script[src$="${DATA}"]`);
  if(!s){s=document.createElement("script");s.src=DATA;document.head.append(s)}
  s.addEventListener("load",ok);s.addEventListener("error",no)});

class HomeGroups extends HTMLElement{
  connectedCallback(){
    if(this._on)return;this._on=1;
    if(!document.getElementById("hg-css")){const st=document.createElement("style");st.id="hg-css";st.textContent=CSS;document.head.append(st)}
    this.innerHTML=TPL;
    const t=this.getAttribute("title");if(t){this.querySelector("#hgTitle").textContent=t;this.removeAttribute("title")}
    // wait for the page to finish parsing (it may load groups/data.js itself), then for the data
    const go=()=>loadData().then(()=>init(this)).catch(()=>{});
    document.readyState==="loading"?document.addEventListener("DOMContentLoaded",go,{once:true}):go();
  }
}
customElements.define("home-groups",HomeGroups);

function init(root){
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const $=s=>root.querySelector(s)||document.querySelector(s);
const TUNER=root.hasAttribute("editable")&&!!document.getElementById("tEdit");
let syncTuner=()=>{},nudge=()=>{},setEditing=()=>{};
/* ---------- data ---------- */
const DAY={mon:["пн","Понеділок"],tue:["вт","Вівторок"],wed:["ср","Середа"],thu:["чт","Четвер"],fri:["пт","П’ятниця"],sat:["сб","Субота"],sun:["нд","Неділя"],flex:["гнучко","Плаваючий графік"]};
const ORDER=Object.keys(DAY);
const BASE=(window.PHILAD_GROUPS||[]).map(g=>({...g}));
const slug=u=>String(u||"").replace(/\/$/,"").split("/").pop();
function derive(g){
  g.archived=g.archived===true||g.archived==="1";
  g.name=g.title||g.leader;
  g.short=g.online?"Онлайн":g.at&&g.at[0]===30.51349?"Голосіївська, 57":String(g.place||"").replace(/^м\. Бровари, /,"Бровари, ");
  g.hay=[g.title,g.leader,g.area,g.place,g.online?"онлайн":"",String(g.place||"").includes("Голосіївська")?"метро голосіївська":"",g.area==="Теремки"||/Теремки/.test(g.place)?"метро теремки":""].join(" ").toLowerCase();
  return g;
}
const G=BASE.map((g,i)=>derive({...g,id:i,ek:slug(g.url)||"g"+i,key:g.at?g.at.join(","):null}))
  .sort((a,b)=>ORDER.indexOf(a.days[0])-ORDER.indexOf(b.days[0])||a.time.localeCompare(b.time,"uk",{numeric:true}));
const initials=n=>n.split(" ").map(w=>w[0]).slice(0,2).join("");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);

/* ---------- filters ---------- */
const WHO=[
  {id:"all",label:"Усі"},
  {id:"young",label:"16–25 років",test:g=>g.youth===true},   // молодіжні групи позначені в groups/data.js полем youth:true
  {id:"mid1",label:"25–35 років",test:g=>g.age&&g.age[0]<=35&&g.age[1]>=25},
  {id:"mid2",label:"35–45 років",test:g=>g.age&&g.age[0]<=45&&g.age[1]>=35},
  {id:"old",label:"Від 45 років",test:g=>g.age&&g.age[1]>45},
  {id:"mamy",label:"Мами й дружини військових",test:g=>g.special},
  {id:"online",label:"Онлайн",test:g=>g.online}
];
const DAYS=[{id:"all",label:"Будь-який"},...ORDER.map(d=>({id:d,label:DAY[d][1]}))];
const st={q:"",who:WHO.some(w=>w.id===root.getAttribute("who"))?root.getAttribute("who"):"all",day:"all",me:null,sel:null};
const km=(a,b)=>{const R=6371,r=Math.PI/180,dl=(b[1]-a[1])*r,dn=(b[0]-a[0])*r,x=Math.sin(dl/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
const fmtKm=d=>(d<10?d.toFixed(1):Math.round(d)).toString().replace(".",",")+" км";
function visible(){
  const q=st.q.trim().toLowerCase();
  let out=G.filter(g=>!g.archived&&(!q||q.split(/\s+/).every(w=>g.hay.includes(w)))
    &&(st.who==="all"||WHO.find(w=>w.id===st.who).test(g))
    &&(st.day==="all"||g.days.includes(st.day)));
  if(st.me){out=out.map(g=>({g,d:g.at?km(st.me,g.at):Infinity})).sort((a,b)=>a.d-b.d).map(x=>(x.g.dist=x.d,x.g))}
  return out;
}

/* ---------- list ---------- */
const list=$("#hgList"),count=$("#hgCount");
const plural=(n,a,b,c)=>{const m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c};
function meta(g){
  const p=[g.short,g.days[0]==="flex"?"графік гнучкий":g.days.map(d=>DAY[d][0]).join("/")+" · "+g.time];
  if(st.me&&g.at)p.push(fmtKm(g.dist));
  return p.join(" · ");
}
function renderList(){
  const v=visible();
  if(st.me){const n=v.filter(g=>g.dist<=5).length;count.textContent=n?`${n} ${plural(n,"група","групи","груп")} у радіусі 5 км`:"Поруч немає груп — ось найближчі"}
  else count.textContent=`${v.length} ${plural(v.length,"група","групи","груп")}`+(v.length===G.filter(g=>!g.archived).length?" у Києві та поруч":"");
  list.innerHTML=v.length?v.map(g=>`<li><button class="hg-card" type="button" data-id="${g.id}"${st.sel===g.id?' aria-current="true"':""}>
      <span class="hg-ava">${g.img?`<img src="groups/${g.img}-a.webp" alt="" width="64" height="64" loading="lazy">`:esc(initials(g.leader))}</span>
      <span class="hg-txt"><span class="hg-name">${esc(g.name)}</span><span class="hg-meta">${esc(meta(g))}</span></span></button></li>`).join("")
    :`<li class="hg-empty">За цими умовами груп немає. <button type="button" id="hgReset">Скинути фільтри</button></li>`;
  const r=$("#hgReset");if(r)r.onclick=()=>{st.q="";st.who="all";st.day="all";$("#hgQ").value="";syncChips();renderList();paintDots()};
  paintDots(v);
}
list.addEventListener("click",e=>{const b=e.target.closest(".hg-card");if(b)select(+b.dataset.id,true)});

/* ---------- dropdowns ---------- */
function menu(btn,box,items,key,lbl,base){
  box.innerHTML=items.map(it=>`<button type="button" role="menuitemradio" data-v="${it.id}" aria-checked="${st[key]===it.id}">${esc(it.label)}</button>`).join("");
  const close=()=>{box.hidden=true;btn.setAttribute("aria-expanded","false")};
  btn.addEventListener("click",e=>{e.stopPropagation();const o=box.hidden;document.querySelectorAll(".hg-menu").forEach(m=>m.hidden=true);document.querySelectorAll("[aria-haspopup]").forEach(b=>b.setAttribute("aria-expanded","false"));
    if(o){box.style.left=btn.offsetLeft+"px";box.hidden=false;btn.setAttribute("aria-expanded","true");box.querySelector('[aria-checked="true"]').focus()}});
  box.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st[key]=b.dataset.v;close();syncChips();renderList();fitVisible();btn.focus()});
  box.addEventListener("keydown",e=>{const bs=[...box.querySelectorAll("button")],i=bs.indexOf(document.activeElement);
    if(e.key==="ArrowDown"){e.preventDefault();bs[(i+1)%bs.length].focus()}else if(e.key==="ArrowUp"){e.preventDefault();bs[(i-1+bs.length)%bs.length].focus()}else if(e.key==="Escape"){close();btn.focus()}});
  document.addEventListener("click",e=>{if(!box.contains(e.target))close()});
  return()=>{const it=items.find(x=>x.id===st[key]);lbl.textContent=st[key]==="all"?base:it.label;btn.classList.toggle("set",st[key]!=="all");
    box.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.v===st[key])))};
}
const syncWho=menu($("#hgWhoBtn"),$("#hgWho"),WHO,"who",$("#hgWhoL"),"Для кого");
const syncDay=menu($("#hgDayBtn"),$("#hgDay"),DAYS,"day",$("#hgDayL"),"День");
const syncChips=()=>{syncWho();syncDay()};
let qt=0;$("#hgQ").addEventListener("input",e=>{st.q=e.target.value;clearTimeout(qt);qt=setTimeout(()=>{renderList();fitVisible()},120)});

// «Поруч зі мною»: sorts by distance from the visitor
const near=$("#hgNear");
near.addEventListener("click",()=>{
  if(st.me){st.me=null;near.setAttribute("aria-pressed","false");renderList();fitVisible();return}
  if(!navigator.geolocation){count.textContent="Браузер не підтримує визначення місця";return}
  count.textContent="Визначаємо, де ви…";
  navigator.geolocation.getCurrentPosition(p=>{st.me=[p.coords.longitude,p.coords.latitude];near.setAttribute("aria-pressed","true");renderList();showMe();fitVisible()},
    ()=>{count.textContent="Не вдалося визначити місце — дозвольте доступ до геолокації";setTimeout(renderList,3500)},{enableHighAccuracy:false,timeout:9000,maximumAge:300000});
});

/* ---------- detail card ---------- */
const det=$("#hgDetail");
function select(id,fromList,quiet){
  const g=G.find(x=>x.id===id);if(!g)return;
  st.sel=id;
  list.querySelectorAll(".hg-card").forEach(b=>{if(+b.dataset.id===id)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current")});
  $("#hgPhoto").innerHTML=g.img?`<img src="groups/${g.img}-w.webp" alt="${esc(g.leader)}" width="900" height="612">`:`<span class="hg-initials">${esc(initials(g.leader))}</span>`;
  paintCard(g);
  const slug=(g.url||"").replace(/\/$/,"").split("/").pop();       // сторінка групи: /groups/<slug>/ (build-group-pages.py)
  $("#hgWrite").href=`/groups/${slug}/#join`;
  const mo=$("#hgMore");mo.hidden=g.archived||!slug;mo.href=`/groups/${slug}/`;
  const r=$("#hgRoute");r.hidden=!g.at;if(g.at)r.href=`https://www.google.com/maps/dir/?api=1&destination=${g.at[1]},${g.at[0]}`;
  det.hidden=false;
  nudge();
  syncTuner();
  paintDots();
  if(fromList&&!quiet&&matchMedia("(max-width:860px)").matches)$(".hg-canvas").scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});
  if(g.at)focus(g.at);
  if(!fromList&&!quiet){const b=list.querySelector(`[data-id="${id}"]`);b&&b.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"})}
}
function paintCard(g){
  const ed=ED.on,dirty=f=>ED.pending[g.ek]&&f in ED.pending[g.ek]?" dirty":"";
  const field=(f,v)=>ed?`<span data-f="${f}" class="${dirty(f).trim()}" contenteditable="plaintext-only" spellcheck="true">${esc(v||"")}</span>`:esc(v||"");
  const nm=$("#hgName");nm.innerHTML=field(g.title?"title":"leader",g.name);
  const sub=$("#hgSub");sub.hidden=!g.title;sub.innerHTML=g.title?"Лідерка — "+field("leader",g.leader):"";
  const rows=ed
    ?[["area","Район",g.area],["place","Адреса",g.place],["when","Коли",g.when],["time","Час у списку",g.time],["size","Кількість",g.size],["ageText",g.special?"Для кого":"Вік",g.ageText],["note","Примітка",g.note]]
    :[["place","Адреса",g.place],g.size&&["size","Кількість",g.size],["when","Коли",g.when],g.ageText&&["ageText",g.special?"Для кого":"Вік",g.ageText],st.me&&g.at&&[null,"Від вас",fmtKm(g.dist??km(st.me,g.at))]].filter(Boolean);
  $("#hgFacts").innerHTML=rows.map(([f,k,v])=>`<div><dt>${k}:</dt><dd>${f?field(f,v):esc(v)}</dd></div>`).join("");
  const n=$("#hgNote");n.hidden=ed||(!g.note&&!g.online);n.textContent=g.note||(g.online?"Група зараз збирається онлайн — посилання на зустріч дасть лідер.":"");
}
function unselect(){st.sel=null;det.hidden=true;setTimeout(syncTuner);list.querySelectorAll("[aria-current]").forEach(b=>b.removeAttribute("aria-current"));paintDots()}
$("#hgClose").onclick=unselect;
addEventListener("keydown",e=>{if(e.key==="Escape"&&!det.hidden&&!document.querySelector(".hg-menu:not([hidden])")&&!(e.target.closest&&e.target.closest("[data-f]")))unselect()});

/* ---------- dots: one per address; the church address holds many groups ---------- */
const spots=new Map();G.forEach(g=>{if(!g.key)return;if(!spots.has(g.key))spots.set(g.key,{at:g.at,ids:[]});spots.get(g.key).ids.push(g.id)});
spots.forEach(s=>{
  const b=document.createElement("button");b.type="button";b.className="hg-dot"+(s.ids.length>1?" many":"");
  b.innerHTML=`<i aria-hidden="true">${s.ids.length>1?s.ids.length:""}</i>`;
  const names=s.ids.map(i=>G.find(g=>g.id===i).name);
  s.label=(s.ids.length>1?`${s.ids.length} груп: `:"Група: ")+names.join(", ");b.setAttribute("aria-label",s.label);b.title=names.length>1?names.length+" груп за цією адресою":names[0];
  b.addEventListener("click",e=>{e.stopPropagation();const v=new Set(visible().map(g=>g.id));const act=s.ids.filter(i=>!G.find(g=>g.id===i).archived),ids=s.ids.filter(i=>v.has(i)).length?s.ids.filter(i=>v.has(i)):act;if(!ids.length)return;
    const k=ids.indexOf(st.sel);select(ids[(k+1)%ids.length])});   // repeat clicks walk through the groups at one address
  s.el=b;
});
function paintDots(v){
  const vis=new Set((v||visible()).map(g=>g.id));
  spots.forEach(s=>{const n=s.ids.filter(i=>vis.has(i)).length,act=s.ids.filter(i=>!G.find(g=>g.id===i).archived).length;
    s.el.hidden=!act;                                                    // every group at this address is archived — no dot
    s.el.classList.toggle("off",!n);s.el.classList.toggle("on",s.ids.includes(st.sel));
    s.el.classList.toggle("many",act>1);s.el.firstChild.textContent=act>1?(n||act):""});
}

/* ---------- map ---------- */
const box=$(".hg-map"),canvas=$(".hg-canvas"),dotsBox=$("#hgDots"),img=$("#hgStatic");
const panelPad=()=>matchMedia("(max-width:860px)").matches?{top:60,bottom:det.hidden?40:det.offsetHeight+36,left:30,right:70}:{top:60,bottom:60,left:canvas.clientWidth>1100?520:460,right:det.hidden?90:400};
const pts=()=>{const v=visible().filter(g=>g.at);return(v.length?v:G.filter(g=>g.at&&!g.archived)).map(g=>g.at)};

// static picture: dark Kyiv tiles (MapTiler · OpenStreetMap) stitched at zoom 11; origin in world pixels
const SM={x0:306125.5,y0:176487,w:1049,h:822.5,z:11};
const wx=(lon,z)=>(lon+180)/360*256*2**z, wy=(lat,z)=>{const r=lat*Math.PI/180;return(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*256*2**z};
const sv={s:1,tx:0,ty:0};
function sPlace(){
  img.style.transform=`translate(${sv.tx}px,${sv.ty}px) scale(${sv.s})`;
  spots.forEach(s=>{const x=(wx(s.at[0],SM.z)-SM.x0)*sv.s+sv.tx,y=(wy(s.at[1],SM.z)-SM.y0)*sv.s+sv.ty;s.el.style.left=x+"px";s.el.style.top=y+"px"});
}
// keep at least part of the picture on screen; the canvas background matches its colour
function sClamp(v){const W=canvas.clientWidth,H=canvas.clientHeight,mx=W*.45,my=H*.45;
  v.tx=Math.min(mx,Math.max(W-SM.w*v.s-mx,v.tx));v.ty=Math.min(my,Math.max(H-SM.h*v.s-my,v.ty));return v}
let anim=0;
function sGo(t,ms){            // picture and dots move together, frame by frame
  cancelAnimationFrame(anim);sClamp(t);
  if(reduce||!ms){Object.assign(sv,t);sPlace();return}
  const a={...sv},t0=performance.now(),ease=x=>1-Math.pow(1-x,3);
  // zoom around a fixed point keeps the motion natural: interpolate scale geometrically, position linearly in screen space
  const step=now=>{const k=Math.min(1,(now-t0)/ms),e=ease(k);
    sv.s=a.s*Math.pow(t.s/a.s,e);sv.tx=a.tx+(t.tx-a.tx)*e;sv.ty=a.ty+(t.ty-a.ty)*e;sPlace();if(k<1)anim=requestAnimationFrame(step)};
  anim=requestAnimationFrame(step);
}
function sFit(points,maxS,ms){
  const W=canvas.clientWidth,H=canvas.clientHeight,p=panelPad();
  const xs=points.map(a=>wx(a[0],SM.z)-SM.x0),ys=points.map(a=>wy(a[1],SM.z)-SM.y0);
  const bx0=Math.min(...xs),bx1=Math.max(...xs),by0=Math.min(...ys),by1=Math.max(...ys);
  const cover=Math.max(W/SM.w,H/SM.h);
  let s=Math.min((W-p.left-p.right)/Math.max(bx1-bx0,1),(H-p.top-p.bottom)/Math.max(by1-by0,1),maxS||2.4);
  s=Math.max(s,cover*.75);
  sGo({s,tx:p.left+(W-p.left-p.right)/2-(bx0+bx1)/2*s,ty:p.top+(H-p.top-p.bottom)/2-(by0+by1)/2*s},ms);
}
function sZoom(k,cx,cy,ms){const W=canvas.clientWidth,H=canvas.clientHeight;cx??=W/2;cy??=H/2;
  const ns=Math.max(Math.max(W/SM.w,H/SM.h)*.75,Math.min(5,sv.s*k));
  sGo({s:ns,tx:cx-(cx-sv.tx)*ns/sv.s,ty:cy-(cy-sv.ty)*ns/sv.s},ms??450)}
spots.forEach(s=>dotsBox.append(s.el));
// drag the static picture
{let d=null;
 canvas.addEventListener("pointerdown",e=>{if(live||e.button>0||e.target.closest("button,a,.hg-detail"))return;cancelAnimationFrame(anim);d={x:e.clientX,y:e.clientY,tx:sv.tx,ty:sv.ty,id:e.pointerId};canvas.setPointerCapture(e.pointerId);canvas.style.cursor="grabbing"});
 canvas.addEventListener("pointermove",e=>{if(!d||e.pointerId!==d.id)return;Object.assign(sv,sClamp({s:sv.s,tx:d.tx+e.clientX-d.x,ty:d.ty+e.clientY-d.y}));sPlace()});
 const end=()=>{d=null;canvas.style.cursor=""};canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
 // ctrl/⌘ + wheel or trackpad pinch zooms at the cursor, like the live map
 canvas.addEventListener("wheel",e=>{if(live||!(e.ctrlKey||e.metaKey))return;e.preventDefault();const r=canvas.getBoundingClientRect();sZoom(Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top,0)},{passive:false});
 canvas.addEventListener("dblclick",e=>{if(live||e.target.closest("button,a,.hg-detail"))return;const r=canvas.getBoundingClientRect();sZoom(1.6,e.clientX-r.left,e.clientY-r.top)});}

// live map: MapLibre GL + MapTiler (same key and look as «Ви вперше у нас?», flat — без 3D)
const MAPTILER_KEY="4xnpIboEIZ8Se3POUMKB";   // ключ «philad.org»: дозволений лише для localhost і philad.org
const STYLE=MAPTILER_KEY?`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`:"https://tiles.openfreemap.org/styles/dark";
const LIB="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/";
const loadLib=()=>new Promise((ok,no)=>{if(window.maplibregl)return ok();
  const l=document.createElement("link");l.rel="stylesheet";l.href=LIB+"maplibre-gl.css";document.head.append(l);
  const s=document.createElement("script");s.src=LIB+"maplibre-gl.js";s.onload=ok;s.onerror=no;document.head.append(s)});
const C={bg:"#1c1e1f",land:"#202324",park:"#1f2a26",water:"#173640",road:"#3d3e3d",major:"#5b5b59",label:"#F7F2E8",halo:"#141414",build:"#26292b"};
function brand(m){
  for(const L of m.getStyle().layers){const id=L.id,sl=L["source-layer"]||"";
    try{
      if(L.type==="background")m.setPaintProperty(id,"background-color",C.bg);
      else if(L.type==="fill"&&sl==="water")m.setPaintProperty(id,"fill-color",C.water);
      else if(L.type==="fill"&&sl==="building")m.setPaintProperty(id,"fill-color",C.build);
      else if(L.type==="fill"&&/park|landcover|landuse/.test(sl))m.setPaintProperty(id,"fill-color",/park|wood|grass/.test(id)?C.park:C.land);
      else if(L.type==="line"&&sl==="waterway")m.setPaintProperty(id,"line-color",C.water);
      else if(L.type==="line"&&sl==="transportation"){m.setPaintProperty(id,"line-color",/motorway|trunk|primary|major/.test(id)?C.major:C.road);m.setPaintProperty(id,"line-opacity",1)}   // opaque: no bright spots where road pieces overlap
      else if(L.type==="symbol"&&m.getLayoutProperty(id,"text-field")){
        if(/name/.test(JSON.stringify(m.getLayoutProperty(id,"text-field"))))m.setLayoutProperty(id,"text-field",["coalesce",["get","name:uk"],["get","name"]]);
        m.setPaintProperty(id,"text-color",C.label);m.setPaintProperty(id,"text-halo-color",C.halo);m.setPaintProperty(id,"text-halo-width",1.2)}
      if(L.type==="fill-extrusion")m.setLayoutProperty(id,"visibility","none");
    }catch(e){}}
}
let live=null,meMk=null;
async function startLive(){
  try{
    if(/[?&]static/.test(location.search))throw 0;   // ?static — test the fallback picture
    const r=await fetch(STYLE);if(!r.ok)throw 0;     // blocked or offline → keep the static picture
    await loadLib();
    const b=bounds(pts());
    const m=new maplibregl.Map({container:"hgLive",style:STYLE,bounds:b,fitBoundsOptions:{padding:panelPad()},pitch:0,bearing:0,dragRotate:false,pitchWithRotate:false,touchPitch:false,
      attributionControl:{compact:true},cooperativeGestures:true,maxZoom:17.5,minZoom:8,
      locale:{"CooperativeGesturesHandler.WindowsHelpText":"Щоб змінити масштаб, тримайте Ctrl і крутіть коліщатко",
              "CooperativeGesturesHandler.MacHelpText":"Щоб змінити масштаб, тримайте ⌘ і крутіть коліщатко",
              "CooperativeGesturesHandler.MobileHelpText":"Рухайте карту двома пальцями"}});
    m.touchZoomRotate.disableRotation();
    m.on("style.load",()=>brand(m));
    m.once("load",()=>{
      live=m;
      spots.forEach(s=>{s.el.style.left=s.el.style.top="";s.mk=new maplibregl.Marker({element:s.el,anchor:"center"}).setLngLat(s.at).addTo(m);s.el.setAttribute("aria-label",s.label)});   // the library renames markers to «Map marker»
      if(st.me)showMe();
      box.classList.add("live");$("#hgLive").removeAttribute("aria-hidden");
      document.querySelectorAll("#hgLive .maplibregl-compact-show").forEach(n=>n.classList.remove("maplibregl-compact-show"));
    });
  }catch(e){/* static picture stays */}
}
function bounds(p){let a=[180,90,-180,-90];p.forEach(([x,y])=>{a=[Math.min(a[0],x),Math.min(a[1],y),Math.max(a[2],x),Math.max(a[3],y)]});return[[a[0],a[1]],[a[2],a[3]]]}
function fitVisible(){
  const p=pts();if(st.me)p.push(st.me);
  if(live){const b=bounds(p);live.fitBounds(b,{padding:panelPad(),maxZoom:15,duration:reduce?0:1200})}
  else sFit(p,null,700);
}
function focus(at){
  if(live)live.flyTo({center:at,zoom:Math.max(live.getZoom(),14),padding:panelPad(),duration:reduce?0:1400,essential:true});
  else{const W=canvas.clientWidth,H=canvas.clientHeight,p=panelPad(),s=Math.max(sv.s,2.4);
    sGo({s,tx:p.left+(W-p.left-p.right)/2-(wx(at[0],SM.z)-SM.x0)*s,ty:p.top+(H-p.top-p.bottom)/2-(wy(at[1],SM.z)-SM.y0)*s},800)}
}
function showMe(){if(!live||!st.me)return;if(!meMk){const e=document.createElement("div");e.style.cssText="width:16px;height:16px;border-radius:50%;background:#7FC4D3;border:3px solid #F7F2E8;box-shadow:0 0 0 8px rgba(127,196,211,.25)";e.setAttribute("aria-label","Ви тут");meMk=new maplibregl.Marker({element:e}).addTo(live)}meMk.setLngLat(st.me)}
$("#hgIn").onclick=()=>live?live.zoomIn():sZoom(1.4);
$("#hgOut").onclick=()=>live?live.zoomOut():sZoom(1/1.4);
$("#hgAll").onclick=()=>{unselect();fitVisible()};
let rt=0;new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>{if(live)return;const g=G.find(x=>x.id===st.sel);g&&g.at?focus(g.at):sFit(pts())},80)}).observe(canvas);
new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){o.disconnect();startLive()}}),{rootMargin:"600px 0px"}).observe(box);

syncChips();renderList();sFit(pts());

/* ---------- editing texts from the tuner ----------
   Правки накладаються поверх groups/data.js:
   groups/edits.json (збережене локально) → спільна база артефакту (якщо є) → ще не збережене.
   Локально «Зберегти» записує groups/edits.json через site/serve.py; в артефакті — у спільну базу. */
const ED={on:false,saved:{},shared:{},pending:{},db:null,mode:/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?"local":"none"};
const FIELDS={archived:"Архів",leader:"Лідер",title:"Назва",area:"Район",place:"Адреса",when:"Коли",time:"Час у списку",size:"Кількість",ageText:"Вік",note:"Примітка"};
function applyEdits(){
  G.forEach(g=>{Object.assign(g,BASE[g.id],ED.saved[g.ek]||{},ED.shared[g.ek]||{},ED.pending[g.ek]||{});derive(g)});
  renderList();
  list.querySelectorAll(".hg-card").forEach(b=>{const g=G.find(x=>x.id===+b.dataset.id);b.classList.toggle("edited",!!(g&&ED.pending[g.ek]))});
  const g=G.find(x=>x.id===st.sel);if(g&&!det.contains(document.activeElement))paintCard(g);
}
const pendingCount=()=>Object.values(ED.pending).reduce((n,r)=>n+Object.keys(r).length,0);

// load what was saved before
fetch("groups/edits.json",{cache:"no-store"}).then(r=>r.ok?r.json():{}).then(j=>{if(j&&typeof j==="object"){ED.saved=j;applyEdits();syncTuner()}}).catch(()=>{});
if(window.claude&&claude.use)claude.use("db").then(db=>{
  if(!db)return;
  ED.db=db;ED.mode="db";if(ED.on)setEditing(true);
  db.collection("groupEdits").onSnapshot(snap=>{
    const m={};snap.docs.forEach(d=>{const v=d.data();if(v)m[d.id]=v});ED.shared=m;applyEdits();syncTuner();
  },()=>{});
}).catch(()=>{});
// open the first group of the list straight away (attribute open-first)
if(root.hasAttribute("open-first")){const f=visible()[0];if(f)select(f.id,true,true)}
}
})();
