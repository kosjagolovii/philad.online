/* «Проповіді» — спільна логіка трьох варіантів: дані, фільтри з лічильниками, пошук, сортування, картки, плеєр.
   Дані — sermons/data.json (його щодня оновлює update-sermons.py). Варіант сторінки відповідає лише за вигляд. */
(function(){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const BASE=new URL("../",document.currentScript.src).href;
const CFG=Object.assign({data:"sermons/data.json",words:["проповідь","проповіді","проповідей"],all:"Усі проповіді"},window.SM_CONFIG||{});   // налаштування сторінки (див. sermons/page.js)
const GROUPS=["topic","speaker","format","dur","year"];          // групи фільтрів
const STEP=12;
const fmtDate=d=>{const [y,m,dd]=d.split("-").map(Number);return new Intl.DateTimeFormat("uk-UA",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,dd))).replace(/\s?р\.$/,"")};
const fmtDur=s=>{if(!s)return"";const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,p=n=>String(n).padStart(2,"0");return h?`${h}:${p(m)}:${p(x)}`:`${m}:${p(x)}`};

const SM={
  esc,fmtDate,fmtDur,
  data:null,items:[],
  state:{q:"",topic:new Set(),speaker:new Set(),format:new Set(),dur:new Set(),year:new Set(),sort:"new",limit:STEP},
  _cb:[],
  onChange(fn){this._cb.push(fn)},
  emit(){this.writeUrl();this._cb.forEach(f=>f(this))},
  async load(){
    try{
      const r=await fetch(BASE+CFG.data,{cache:"no-store"});
      if(!r.ok)throw 0;
      this.data=await r.json();
    }catch(e){                                    // сторінку відкрито як файл (без сервера) — беремо дані зі скрипта
      if(CFG.data!=="sermons/data.json")throw e;
      if(!window.SERMONS_DATA)await new Promise((ok,no)=>{const sc=document.createElement("script");sc.src=BASE+"sermons/data.js";sc.onload=ok;sc.onerror=no;document.head.appendChild(sc)});
      this.data=window.SERMONS_DATA;
    }
    this.items=this.data.items;
    this.topicLabel=Object.fromEntries(this.data.topics.map(t=>[t.id,t.label]));
    this.durLabel=Object.fromEntries(this.data.durations.map(t=>[t.id,t.label]));
    this.readUrl();
    return this;
  },
  /* ---------- адреса: ?topic=faith,love&speaker=… — посилання на добірку можна надіслати ---------- */
  readUrl(){
    const q=new URLSearchParams(location.search),s=this.state;
    s.q=q.get("q")||"";s.sort=q.get("sort")||"new";
    GROUPS.forEach(g=>{s[g]=new Set((q.get(g)||"").split("|").filter(Boolean))});
  },
  writeUrl(){
    const q=new URLSearchParams(),s=this.state;
    if(s.q)q.set("q",s.q);if(s.sort!=="new")q.set("sort",s.sort);
    GROUPS.forEach(g=>{if(s[g].size)q.set(g,[...s[g]].join("|"))});
    const u=location.pathname+(q.toString()?"?"+q.toString():"");
    try{history.replaceState(null,"",u)}catch(e){}
  },
  /* ---------- фільтрація ---------- */
  match(it,skip){
    const s=this.state;
    if(s.q){const t=s.q.toLowerCase();if(!(it.title.toLowerCase().includes(t)||it.speaker.toLowerCase().includes(t)))return false}
    if(skip!=="topic"&&s.topic.size&&![...s.topic].every(t=>it.topics.includes(t)))return false;   // кілька тем = усі разом
    if(skip!=="speaker"&&s.speaker.size&&!s.speaker.has(it.speaker))return false;
    if(skip!=="format"&&s.format.size&&!s.format.has(it.format))return false;
    if(skip!=="dur"&&s.dur.size&&!s.dur.has(it.dur))return false;
    if(skip!=="year"&&s.year.size&&!s.year.has(it.date.slice(0,4)))return false;
    return true;
  },
  filtered(){
    const l=this.items.filter(i=>this.match(i));
    const by={new:(a,b)=>b.date.localeCompare(a.date),old:(a,b)=>a.date.localeCompare(b.date),long:(a,b)=>(b.sec||0)-(a.sec||0),short:(a,b)=>(a.sec||1e9)-(b.sec||1e9)}[this.state.sort]||((a,b)=>b.date.localeCompare(a.date));
    return l.sort(by);
  },
  /* варіанти групи з лічильниками «скільки проповідей лишиться, якщо обрати це» */
  facets(group){
    const pool=this.items.filter(i=>this.match(i,group)),cnt=new Map();
    const val=i=>group==="topic"?i.topics:group==="year"?[i.date.slice(0,4)]:[i[group]];
    pool.forEach(i=>val(i).forEach(v=>{if(v)cnt.set(v,(cnt.get(v)||0)+1)}));
    const all=new Set(this.items.flatMap(val).filter(Boolean));
    let list=[...all].map(v=>({value:v,count:cnt.get(v)||0,active:this.state[group].has(v),
      label:group==="topic"?this.topicLabel[v]:group==="dur"?this.durLabel[v]:v,
      avatar:group==="speaker"&&this.data.avatars[v]?BASE+this.data.avatars[v]:null}));
    if(group==="speaker"&&CFG.hideSpeaker)list=list.filter(f=>f.value!==CFG.hideSpeaker);   // «Невідомий спікер» не показуємо як фільтр
    if(group==="topic")list.sort((a,b)=>this.data.topics.findIndex(t=>t.id===a.value)-this.data.topics.findIndex(t=>t.id===b.value));
    else if(group==="dur")list.sort((a,b)=>this.data.durations.findIndex(t=>t.id===a.value)-this.data.durations.findIndex(t=>t.id===b.value));
    else if(group==="year")list.sort((a,b)=>b.value.localeCompare(a.value));
    else list.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,"uk"));
    return list;
  },
  total(group){return this.facets(group).length},
  toggle(group,val){const s=this.state[group];s.has(val)?s.delete(val):s.add(val);this.state.limit=STEP;this.emit()},
  setQ(q){this.state.q=q.trim();this.state.limit=STEP;this.emit()},
  setSort(v){this.state.sort=v;this.emit()},
  more(){this.state.limit+=STEP;this.emit()},
  reset(){const s=this.state;s.q="";GROUPS.forEach(g=>s[g].clear());s.limit=STEP;this.emit()},
  activeCount(){const s=this.state;return GROUPS.reduce((n,g)=>n+s[g].size,0)+(s.q?1:0)},
  activeList(){   // для рядка «Обрано: …» з можливістю зняти
    const s=this.state,out=[];
    GROUPS.forEach(g=>s[g].forEach(v=>out.push({group:g,value:v,label:g==="topic"?this.topicLabel[v]:g==="dur"?this.durLabel[v]:v})));
    return out;
  },
  plural(n){const a=n%10,b=n%100,w=CFG.words;return(b>10&&b<15)?w[2]:a===1?w[0]:(a>1&&a<5)?w[1]:w[2]},
  /* ---------- картка ---------- */
  thumb(id){return `https://i.ytimg.com/vi/${id}/hq720.jpg`},
  card(it,o){
    o=o||{};
    const av=this.data.avatars[it.speaker];
    return `<article class="sc${o.row?" sc-row":""}">
      <button class="sc-img" type="button" data-play="${esc(it.id)}" aria-label="Дивитись: ${esc(it.title)}">
        <img src="${this.thumb(it.id)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${esc(it.id)}/mqdefault.jpg'">
        ${it.sec?`<span class="sc-dur">${fmtDur(it.sec)}</span>`:""}<span class="sc-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.9l11-6.8a1 1 0 0 0 0-1.8l-11-6.8A1 1 0 0 0 8 5.2Z" fill="currentColor"/></svg></span>
      </button>
      <div class="sc-b">
        <p class="sc-meta"><time datetime="${esc(it.date)}">${fmtDate(it.date)}</time>${it.format!=="Проповідь"?`<span class="sc-fmt">${esc(it.format)}</span>`:""}</p>
        <h3><button type="button" data-play="${esc(it.id)}">${esc(it.title)}</button></h3>
        ${it.speaker===CFG.hideSpeaker?"":`<button class="sc-by" type="button" data-toggle="speaker:${esc(it.speaker)}" title="${esc(CFG.all)}: ${esc(it.speaker)}">${av?`<img src="${BASE+av}" alt="" width="28" height="28" loading="lazy">`:`<i aria-hidden="true">${esc(it.speaker.split(" ").map(w=>w[0]).slice(0,2).join(""))}</i>`}<span>${esc(it.speaker)}</span></button>`}
        ${o.noTags?"":`<div class="sc-tags">${it.topics.map(t=>`<button type="button" data-toggle="topic:${esc(t)}">${esc(this.topicLabel[t])}</button>`).join("")}</div>`}
      </div></article>`;
  },
  /* ---------- плеєр у вікні ---------- */
  openPlayer(id){
    const it=this.items.find(i=>i.id===id);if(!it)return;
    let d=document.getElementById("sm-modal");
    if(!d){
      d=document.createElement("dialog");d.id="sm-modal";d.className="sm-modal";
      d.innerHTML='<div class="sm-box"><button class="sm-x" type="button" aria-label="Закрити"><svg viewBox="0 0 40 40" aria-hidden="true"><rect class="mc" width="40" height="40" rx="20"/><rect class="ml ml1" x="12" y="16" width="16" height="2" rx="1"/><rect class="ml ml2" x="12" y="22" width="16" height="2" rx="1"/></svg></button><div class="sm-frame"></div><div class="sm-info"></div></div>';
      document.body.appendChild(d);
      const close=()=>{d.close()};
      d.querySelector(".sm-x").addEventListener("click",close);
      d.addEventListener("click",e=>{if(e.target===d)close()});
      d.addEventListener("close",()=>{d.querySelector(".sm-frame").innerHTML="";document.documentElement.classList.remove("sm-lock")});
    }
    d.querySelector(".sm-frame").innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1&rel=0&playsinline=1" title="${esc(it.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    d.querySelector(".sm-info").innerHTML=`<div><h2>${esc(it.title)}</h2><p>${esc(it.speaker)} · ${fmtDate(it.date)}</p></div><a href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">Відкрити на YouTube</a>${it.page?`<a href="${esc(it.page)}">Сторінка відео</a>`:""}`;
    document.documentElement.classList.add("sm-lock");
    d.showModal();
  },
  /* клік по [data-play], [data-toggle="група:значення"], [data-reset], [data-more] будь-де на сторінці */
  wire(){
    document.addEventListener("click",e=>{
      const p=e.target.closest("[data-play]");if(p){e.preventDefault();this.openPlayer(p.dataset.play);return}
      const t=e.target.closest("[data-toggle]");if(t){const i=t.dataset.toggle.indexOf(":");this.toggle(t.dataset.toggle.slice(0,i),t.dataset.toggle.slice(i+1));return}
      if(e.target.closest("[data-reset]")){this.reset();return}
      if(e.target.closest("[data-more]")){this.more();return}
    });
  },
  init(){
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ft=document.getElementById("footer");if(ft)ft.setAttribute("data-dark","");
    this.wire();
  }
};
window.SM=SM;
})();
