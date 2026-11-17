/* «Теми домашніх груп» — спільна логіка трьох варіантів: дані, фільтри з лічильниками, пошук, сортування, картки.
   Дані — hgthemes/data.json (його оновлює update-hgthemes.py). Варіант сторінки відповідає лише за вигляд. */
(function(){
"use strict";
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const BASE=new URL("../",document.currentScript.src).href;
const GROUPS=["tag","book","year","lang"];
const LANG={uk:"Українська",ru:"Російська"};
const STEP=18;                                   // скільки карток підвантажується за раз при прокручуванні
const fmtDate=d=>{const [y,m,dd]=d.split("-").map(Number);return new Intl.DateTimeFormat("uk-UA",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,dd))).replace(/\s?р\.$/,"")};

const HG={
  esc,fmtDate,STEP,
  data:null,items:[],
  state:{q:"",tag:new Set(),book:new Set(),year:new Set(),lang:new Set(),sort:"new",limit:STEP,guests:false},
  _cb:[],
  onChange(fn){this._cb.push(fn)},
  emit(){this.writeUrl();this._cb.forEach(f=>f(this))},
  async load(){
    try{
      const r=await fetch(BASE+"hgthemes/data.json",{cache:"no-store"});
      if(!r.ok)throw 0;
      this.data=await r.json();
    }catch(e){                                    // сторінку відкрито як файл (без сервера) — беремо дані зі скрипта
      if(!window.HGTHEMES_DATA)await new Promise((ok,no)=>{const sc=document.createElement("script");sc.src=BASE+"hgthemes/data.js";sc.onload=ok;sc.onerror=no;document.head.appendChild(sc)});
      this.data=window.HGTHEMES_DATA;
    }
    this.items=this.data.items;
    this.tagLabel=Object.fromEntries(this.data.tags.map(t=>[t.id,t.label]));
    this.bookLabel=Object.fromEntries(this.data.books.map(t=>[t.id,t.label]));
    this.readUrl();
    return this;
  },
  readUrl(){
    const q=new URLSearchParams(location.search),s=this.state;
    s.q=q.get("q")||"";s.sort=q.get("sort")||"new";s.guests=q.get("guests")==="1";
    GROUPS.forEach(g=>{s[g]=new Set((q.get(g)||"").split("|").filter(Boolean))});
  },
  writeUrl(){
    const q=new URLSearchParams(),s=this.state;
    if(s.q)q.set("q",s.q);if(s.sort!=="new")q.set("sort",s.sort);if(s.guests)q.set("guests","1");
    GROUPS.forEach(g=>{if(s[g].size)q.set(g,[...s[g]].join("|"))});
    try{history.replaceState(null,"",location.pathname+(q.toString()?"?"+q.toString():""))}catch(e){}
  },
  /* ---------- фільтрація ---------- */
  match(it,skip){
    const s=this.state;
    if(s.q){const t=s.q.toLowerCase();if(!((it.title+" "+(it.excerpt||"")+" "+(it.text||"")).toLowerCase().includes(t)))return false}
    if(skip!=="guests"&&s.guests&&!it.tags.includes("guests"))return false;
    if(skip!=="tag"&&s.tag.size&&![...s.tag].every(t=>it.tags.includes(t)))return false;     // кілька міток = усі разом
    if(skip!=="book"&&s.book.size&&![...s.book].some(b=>it.refs.includes(b)))return false;    // кілька книг = будь-яка з них
    if(skip!=="year"&&s.year.size&&!s.year.has(it.date.slice(0,4)))return false;
    if(skip!=="lang"&&s.lang.size&&!s.lang.has(it.lang||"uk"))return false;
    return true;
  },
  filtered(){
    const l=this.items.filter(i=>this.match(i));
    const by={new:(a,b)=>b.date.localeCompare(a.date),old:(a,b)=>a.date.localeCompare(b.date),az:(a,b)=>a.title.localeCompare(b.title,"uk"),q:(a,b)=>b.q-a.q}[this.state.sort]||((a,b)=>b.date.localeCompare(a.date));
    return l.sort(by);
  },
  facets(group){
    const pool=this.items.filter(i=>this.match(i,group)),cnt=new Map();
    const val=i=>group==="tag"?i.tags:group==="book"?i.refs:group==="lang"?[i.lang||"uk"]:[i.date.slice(0,4)];
    pool.forEach(i=>val(i).forEach(v=>cnt.set(v,(cnt.get(v)||0)+1)));
    const all=new Set(this.items.flatMap(val));
    let list=[...all].map(v=>({value:v,count:cnt.get(v)||0,active:this.state[group].has(v),
      label:group==="tag"?this.tagLabel[v]:group==="book"?this.bookLabel[v]:group==="lang"?LANG[v]:v}));
    if(group==="tag"){
      const ord=Object.fromEntries(this.data.tags.map((t,i)=>[t.id,i]));
      list.forEach(f=>{const t=this.data.tags.find(x=>x.id===f.value);f.group=t&&t.group});
      list.sort((a,b)=>ord[a.value]-ord[b.value]);
    }else if(group==="book"){
      const ord=Object.fromEntries(this.data.books.map((t,i)=>[t.id,i]));
      list.forEach(f=>{const t=this.data.books.find(x=>x.id===f.value);f.testament=t&&t.testament});
      list.sort((a,b)=>ord[a.value]-ord[b.value]);
    }else if(group==="lang")list.sort((a,b)=>(a.value==="uk"?0:1)-(b.value==="uk"?0:1));
    else list.sort((a,b)=>b.value.localeCompare(a.value));
    return list;
  },
  guestsCount(){return this.items.filter(i=>this.match(i,"guests")&&i.tags.includes("guests")).length},
  toggle(group,val){
    if(group==="guests"){this.state.guests=!this.state.guests}
    else{const s=this.state[group];s.has(val)?s.delete(val):s.add(val)}
    this.state.limit=STEP;this.emit()
  },
  setQ(q){this.state.q=q.trim();this.state.limit=STEP;this.emit()},
  setSort(v){this.state.sort=v;this.emit()},
  more(){this.state.limit+=STEP;this.emit()},
  reset(){const s=this.state;s.q="";s.guests=false;GROUPS.forEach(g=>s[g].clear());s.limit=STEP;this.emit()},
  activeCount(){const s=this.state;return GROUPS.reduce((n,g)=>n+s[g].size,0)+(s.q?1:0)+(s.guests?1:0)},
  activeList(){
    const s=this.state,out=[];
    if(s.guests)out.push({group:"guests",value:"1",label:"Для невоцерковлених гостей"});
    GROUPS.forEach(g=>s[g].forEach(v=>out.push({group:g,value:v,label:g==="tag"?this.tagLabel[v]:g==="book"?this.bookLabel[v]:g==="lang"?LANG[v]:v})));
    return out;
  },
  plural(n){const a=n%10,b=n%100;return(b>10&&b<15)?"тем":a===1?"тема":(a>1&&a<5)?"теми":"тем"},
  /* ---------- картка ---------- */
  card(it){
    return `<article class="tc">
      <a class="tc-img" href="${esc(it.page||it.url)}" tabindex="-1" aria-hidden="true">${it.img?`<img src="${BASE+it.img}" alt="" loading="lazy" decoding="async">`:""}</a>
      <div class="tc-b">
        <time class="tc-meta" datetime="${esc(it.date)}">${fmtDate(it.date)}</time>
        <h3><a href="${esc(it.page||it.url)}">${esc(it.title)}</a></h3>
        ${it.excerpt?`<p class="tc-ex">${esc(it.excerpt)}</p>`:""}
      </div></article>`;
  },
  wire(){
    document.addEventListener("click",e=>{
      const t=e.target.closest("[data-toggle]");if(t){const i=t.dataset.toggle.indexOf(":");this.toggle(t.dataset.toggle.slice(0,i),t.dataset.toggle.slice(i+1));return}
      if(e.target.closest("[data-reset]")){this.reset();return}
      if(e.target.closest("[data-more]")){this.more();return}
    });
  },
  init(){
    const ft=document.getElementById("footer");if(ft)ft.setAttribute("data-dark","");
    this.wire();
  }
};
window.HG=HG;
})();
