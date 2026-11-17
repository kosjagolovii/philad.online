/* Тюнер текстів сторінки — редагування будь-яких текстів просто на сторінці.
   Підключення:  <script src="components/text-tuner.js" data-name="history"></script>  в кінці <body>.
   Редагуються всі елементи з атрибутом data-k="унікальний-ключ" (простий текст, без розмітки всередині).
   Правки накладаються поверх тексту в HTML:  edits/<name>.json (збережене локально) → спільна база артефакту (колекція pageEdits, документ <name>) → ще не збережене.
   Локально «Зберегти» записує edits/<name>.json через site/serve.py (POST /__save/text-edits/<name>);
   в опублікованому артефакті — у спільну базу (потрібна можливість db). Інакше можна скопіювати правки JSON. */
(()=>{
const S=document.currentScript,NAME=(S&&S.dataset.name)||location.pathname.replace(/^.*\//,"").replace(/\.html$/,"")||"page";
const els=[...document.querySelectorAll("[data-k]")];
if(!els.length)return;
const $=s=>document.getElementById(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const plural=(n,a,b,c)=>{const m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<10||h>=20)?b:c};

const css=`
.tt-tab,.tt{--t-ink:#F7F2E8;--t-panel:rgba(20,17,15,.86);--t-line:rgba(255,255,255,.14);--t-mute:rgba(255,255,255,.55);--t-accent:#E9C46A;--t-changed:#5FD4FF;
  --t-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.tt-tab{position:fixed;z-index:90;right:0;top:50%;transform:translateY(-50%);writing-mode:vertical-rl;
  font:600 11px/1 var(--t-mono);letter-spacing:.18em;text-transform:uppercase;color:var(--t-ink);
  padding:16px 9px;padding-right:calc(9px + env(safe-area-inset-right,0px));
  background:var(--t-panel);border:1px solid var(--t-line);border-right:0;border-radius:10px 0 0 10px;cursor:pointer;
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.tt-tab:hover{color:var(--t-accent)}
.tt-tab:focus-visible{outline:2px solid var(--t-accent);outline-offset:2px}
.tt-tab i{display:inline-block;width:7px;height:7px;margin-top:8px;border-radius:50%;background:var(--t-changed)}
.tt-tab i[hidden]{display:none}
.tt{position:fixed;z-index:95;top:0;right:0;bottom:0;width:min(340px,92vw);display:flex;flex-direction:column;
  background:var(--t-panel);border-left:1px solid var(--t-line);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  font:400 12px/1.35 var(--t-mono);color:var(--t-ink);transform:translateX(102%);transition:transform .32s cubic-bezier(.2,.7,.2,1)}
.tt.open{transform:none}
.tt[hidden]{display:flex;visibility:hidden}
.tt.open[hidden]{visibility:visible}
.tt header{display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:calc(16px + env(safe-area-inset-top,0px)) calc(16px + env(safe-area-inset-right,0px)) 12px 16px;border-bottom:1px solid var(--t-line)}
.tt header b{font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:11px}
.tt button{font:600 11px/1 var(--t-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--t-ink);
  background:transparent;border:1px solid var(--t-line);border-radius:7px;padding:9px 10px;cursor:pointer}
.tt button:hover:not(:disabled){border-color:var(--t-accent);color:var(--t-accent)}
.tt button:focus-visible{outline:2px solid var(--t-accent);outline-offset:2px}
.tt button:disabled{opacity:.4;cursor:default}
.tt button[aria-pressed="true"]{background:var(--t-accent);border-color:var(--t-accent);color:#14110F}
.tt .body{flex:1;overflow:auto;padding:4px 16px 16px;padding-right:calc(16px + env(safe-area-inset-right,0px))}
.tt h4{margin:16px 0 8px;font:600 10px/1 var(--t-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--t-mute)}
.tt p{margin:0 0 12px;color:var(--t-mute);font-size:11px;line-height:1.5}
.tt-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.tt-row button{flex:1 1 auto}
.tt-status{display:block;min-height:1.5em;color:var(--t-mute);font-size:11px;line-height:1.5}
.tt-status.ok{color:#8FE3A5}.tt-status.warn{color:var(--t-changed)}.tt-status.err{color:#FF9B8A}
.tt-list{margin:0;padding:0;list-style:none;display:grid;gap:4px}
.tt-list li{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,.05);font-size:11px}
.tt-list li b{font-weight:600;color:var(--t-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tt-list li span{color:var(--t-changed);flex:none}
.tt textarea{width:100%;box-sizing:border-box;height:120px;font:11px/1.4 var(--t-mono);color:var(--t-ink);background:rgba(0,0,0,.35);border:1px solid var(--t-line);border-radius:6px;padding:8px}
/* edit mode: every marked text can be typed over in place */
.tt-editing [data-k]{border-radius:4px;outline:1px dashed rgba(49,124,142,.7);outline-offset:3px;cursor:text;min-width:2ch}
.tt-editing [data-k]:hover{background:rgba(49,124,142,.1)}
.tt-editing [data-k]:focus{outline:2px solid #317C8E;background:rgba(255,255,255,.7)}
.tt-editing [data-k].tt-dirty{background:rgba(95,212,255,.22)}
.tt-editing [data-k]:empty::before{content:"—";opacity:.35}
@media (prefers-reduced-motion:reduce){.tt{transition:none}}`;
const st=document.createElement("style");st.textContent=css;document.head.append(st);

document.body.insertAdjacentHTML("beforeend",`
<button class="tt-tab" id="ttTab" type="button" aria-controls="tt" aria-expanded="false">Тюнер<i id="ttDot" hidden></i></button>
<aside class="tt" id="tt" aria-label="Тюнер сторінки" hidden>
  <header><b>Тюнер</b><button type="button" id="ttClose">Закрити</button></header>
  <div class="body">
    <h4>Тексти сторінки</h4>
    <p>Увімкніть редагування й виправте будь-який текст — заголовок, підзаголовок, рік чи розділ — просто на сторінці. Enter завершує правку.</p>
    <div class="tt-row"><button type="button" id="ttEdit" aria-pressed="false">Редагувати</button></div>
    <div class="tt-row"><button type="button" id="ttSave" disabled>Зберегти</button><button type="button" id="ttUndo" disabled>Скасувати</button></div>
    <span class="tt-status" id="ttStatus" role="status"></span>
    <h4>Змінено</h4>
    <ul class="tt-list" id="ttList"><li><b>Поки нічого</b></li></ul>
    <h4>Для розробника</h4>
    <div class="tt-row"><button type="button" id="ttCopy">Копіювати правки JSON</button></div>
    <textarea id="ttJson" readonly hidden aria-label="Правки у форматі JSON"></textarea>
  </div>
</aside>`);

const BASE={};els.forEach(e=>{BASE[e.dataset.k]=e.textContent.replace(/\s+/g," ").trim()});
const ED={on:false,saved:{},shared:{},pending:{},db:null,mode:/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?"local":"none"};
const base=k=>ED.shared[k]??ED.saved[k]??BASE[k];
const cur=k=>k in ED.pending?ED.pending[k]:base(k);
const pendingCount=()=>Object.keys(ED.pending).length;
const say=(t,c="")=>{$("ttStatus").textContent=t;$("ttStatus").className="tt-status "+c};

function paint(){
  els.forEach(e=>{const k=e.dataset.k,v=cur(k);if(document.activeElement!==e&&e.textContent!==v)e.textContent=v;e.classList.toggle("tt-dirty",k in ED.pending)});
}
function sync(){
  const n=pendingCount();
  $("ttSave").disabled=!n;$("ttUndo").disabled=!n;$("ttDot").hidden=!n;
  $("ttList").innerHTML=n?Object.keys(ED.pending).map(k=>`<li><b>${esc((BASE[k]||k).slice(0,38))}</b><span>змінено</span></li>`).join(""):"<li><b>Поки нічого</b></li>";
  if(n)say(`Незбережених правок: ${n}`,"warn");
}
const norm=s=>s.replace(/\s+/g," ").trim();
document.addEventListener("input",e=>{
  const el=e.target.closest&&e.target.closest("[data-k]");if(!el)return;
  const k=el.dataset.k,v=norm(el.textContent);
  if(v===base(k))delete ED.pending[k];else ED.pending[k]=v;
  el.classList.toggle("tt-dirty",k in ED.pending);sync();
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&ED.on&&e.target.closest&&e.target.closest("[data-k]")){e.preventDefault();e.target.blur()}});
document.addEventListener("paste",e=>{
  if(!ED.on||!(e.target.closest&&e.target.closest("[data-k]")))return;
  e.preventDefault();document.execCommand("insertText",false,(e.clipboardData||window.clipboardData).getData("text").replace(/\s+/g," "));
});

function setEditing(on){
  ED.on=on;document.body.classList.toggle("tt-editing",on);
  els.forEach(e=>{if(on)e.setAttribute("contenteditable","plaintext-only");else e.removeAttribute("contenteditable");e.spellcheck=true});
  $("ttEdit").setAttribute("aria-pressed",String(on));$("ttEdit").textContent=on?"Редагування увімкнено":"Редагувати";
  if(on)say(ED.mode==="local"?`Зміни запишуться у edits/${NAME}.json.`:ED.mode==="db"?"Зміни побачать усі, хто має посилання.":"Зберегти тут не вийде — скопіюйте правки JSON і надішліть.",ED.mode==="none"?"warn":"");
}
$("ttEdit").onclick=()=>setEditing(!ED.on);

async function save(){
  const n=pendingCount();if(!n)return;
  $("ttSave").disabled=true;say("Зберігаємо…");
  const merge=src=>{const all={...src,...ED.pending};for(const k of Object.keys(all))if(all[k]===BASE[k])delete all[k];return all};
  try{
    if(ED.mode==="local"){
      const all=merge(ED.saved);
      const r=await fetch("/__save/text-edits/"+encodeURIComponent(NAME),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(all)});
      const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||("HTTP "+r.status));
      ED.saved=all;
    }else if(ED.mode==="db"){
      const all=merge(ED.shared);
      await ED.db.collection("pageEdits").doc(NAME).set(all);ED.shared=all;
    }else throw new Error("no-backend");
    ED.pending={};paint();sync();say(`Збережено: ${n} ${plural(n,"правка","правки","правок")}.`,"ok");
  }catch(e){
    $("ttSave").disabled=false;
    say(e.message==="no-backend"?"Тут немає куди зберегти. Натисніть «Копіювати правки JSON» і надішліть мені.":"Не вдалося зберегти: "+e.message,"err");
  }
}
$("ttSave").onclick=save;
$("ttUndo").onclick=()=>{ED.pending={};paint();sync();say("Незбережені правки скасовано.")};
$("ttCopy").onclick=async()=>{
  const all={...ED.saved,...ED.shared,...ED.pending};for(const k of Object.keys(all))if(all[k]===BASE[k])delete all[k];
  const ta=$("ttJson"),txt=JSON.stringify(all,null,1);ta.hidden=false;ta.value=txt;
  try{await navigator.clipboard.writeText(txt);say("Правки скопійовано.","ok")}catch(e){ta.select();say("Виділено — скопіюйте вручну (⌘C).","warn")}
};
addEventListener("beforeunload",e=>{if(pendingCount()){e.preventDefault();e.returnValue=""}});

const tab=$("ttTab"),panel=$("tt");
function setOpen(o){panel.hidden=false;panel.classList.toggle("open",o);tab.setAttribute("aria-expanded",String(o));
  if(!o)setTimeout(()=>{if(!panel.classList.contains("open"))panel.hidden=true},340);
  try{localStorage.setItem("philad-tt-open-"+NAME,o?"1":"")}catch(e){}}
tab.onclick=()=>setOpen(!panel.classList.contains("open"));
$("ttClose").onclick=()=>setOpen(false);
try{if(localStorage.getItem("philad-tt-open-"+NAME))setOpen(true)}catch(e){}

// what was saved before
fetch("edits/"+encodeURIComponent(NAME)+".json",{cache:"no-store"}).then(r=>r.ok?r.json():{}).then(j=>{if(j&&typeof j==="object"){ED.saved=j;paint();sync()}}).catch(()=>{});
if(window.claude&&claude.use)claude.use("db").then(db=>{
  if(!db)return;
  ED.db=db;ED.mode="db";
  db.collection("pageEdits").doc(NAME).onSnapshot(snap=>{
    const v=snap&&snap.data?snap.data():null;ED.shared=(v&&typeof v==="object")?v:{};paint();sync();
  },()=>{});
}).catch(()=>{});
sync();
})();
