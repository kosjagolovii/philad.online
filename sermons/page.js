/* СТОРІНКА СПИСКУ ВІДЕО — один компонент для «Проповідей» і «Відеобібліотеки».
   Сторінка задає window.SM_CONFIG={data:"sermons/data.json", title:"Проповіді", words:["проповідь","проповіді","проповідей"], ...},
   далі підключає sermons/base.js і цей файл. Фільтри, пошук, картки, плеєр — у sermons/base.js; вигляд — sermons/base.css + sermons/page.css. */
(async()=>{
const SM=window.SM,{esc}=SM;
const C=Object.assign({title:"Проповіді"},window.SM_CONFIG||{});
await SM.load();
const app=document.getElementById("app");
app.innerHTML=`<div class="row-w">
  <header class="top"><h1 class="sm-h1">${esc(C.title)}</h1><p class="lead" id="lead"></p></header>
  <div class="lay">
    <aside class="side" id="side" aria-label="Фільтри">
      <label class="search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m14 14 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input id="q" type="search" placeholder="Назва або спікер" autocomplete="off"></label>
      <details class="fg" open><summary>Тема</summary><div class="fl" data-facet="topic"></div></details>
      <details class="fg" open><summary>Спікер</summary><div class="spk" data-facet="speaker"></div><button class="reset spk-more" id="spkMore" type="button"></button></details>
      <details class="fg" open><summary>Формат</summary><div class="fl" data-facet="format"></div></details>
      <details class="fg" open><summary>Тривалість</summary><div class="fl" data-facet="dur"></div></details>
      <details class="fg" open><summary>Рік</summary><div class="fl" data-facet="year"></div></details>
    </aside>
    <section class="res" aria-live="polite">
      <div class="rh"><div class="rinfo"><button class="chip fbtn" id="fbtn" type="button">Фільтри</button><span id="count"></span><button class="reset" data-reset id="reset" type="button" hidden>Скинути все</button></div>
        <select class="sel" id="sort" aria-label="Сортування"><option value="new">Спочатку нові</option><option value="old">Спочатку старі</option><option value="long">Найдовші</option><option value="short">Найкоротші</option></select></div>
      <div class="act" id="act"></div>
      <div class="grid3" id="grid"></div>
      <div style="display:grid;justify-items:center" id="moreW"></div>
    </section>
  </div></div>`;
let allSpk=false;
const q=document.getElementById("q"),sort=document.getElementById("sort");
q.value=SM.state.q;sort.value=SM.state.sort;
q.addEventListener("input",()=>SM.setQ(q.value));
sort.addEventListener("change",()=>SM.setSort(sort.value));
document.getElementById("fbtn").addEventListener("click",()=>document.getElementById("side").classList.toggle("open"));
document.getElementById("spkMore").addEventListener("click",()=>{allSpk=!allSpk;render()});
const chip=(g,f,extra)=>`<button class="chip${f.count?"":" zero"}" type="button" aria-pressed="${f.active}" data-toggle="${g}:${esc(f.value)}">${extra||""}<span>${esc(f.label)}</span><em>${f.count}</em></button>`;
function render(){

  ["topic","format","dur","year"].forEach(g=>{document.querySelector(`[data-facet="${g}"]`).innerHTML=SM.facets(g).map(f=>chip(g,f)).join("")});
  const sp=SM.facets("speaker"),shown=allSpk?sp:sp.filter((f,i)=>i<8||f.active);
  document.querySelector('[data-facet="speaker"]').innerHTML=shown.map(f=>chip("speaker",f,f.avatar?`<img src="${f.avatar}" alt="" loading="lazy">`:`<i aria-hidden="true">${esc(f.label.split(" ").map(w=>w[0]).slice(0,2).join(""))}</i>`)).join("");
  const mb=document.getElementById("spkMore");mb.hidden=sp.length<=8;mb.textContent=allSpk?"Згорнути":`Показати всіх (${sp.length})`;
  const list=SM.filtered(),n=list.length;
  document.getElementById("count").textContent=`${n} ${SM.plural(n)}`;
  document.getElementById("lead").textContent=`${SM.items.length} ${SM.plural(SM.items.length)} в архіві — шукайте за темою, спікером чи форматом`;
  document.getElementById("reset").hidden=!SM.activeCount();
  document.getElementById("act").innerHTML=SM.activeList().map(a=>`<button class="chip" type="button" data-toggle="${a.group}:${esc(a.value)}" aria-label="Зняти: ${esc(a.label)}">${esc(a.label)}</button>`).join("");
  document.getElementById("grid").innerHTML=n?list.slice(0,SM.state.limit).map(i=>SM.card(i)).join(""):`<div class="empty" style="grid-column:1/-1"><b>Нічого не знайдено</b><span>Спробуйте прибрати частину фільтрів</span><button class="reset" data-reset type="button">Скинути все</button></div>`;
  document.getElementById("moreW").innerHTML=n>SM.state.limit?`<button class="more" data-more type="button">Показати ще ${Math.min(12,n-SM.state.limit)}</button>`:"";
  if(document.activeElement!==q&&q.value!==SM.state.q)q.value=SM.state.q;
}
SM.onChange(render);render();
SM.init();
})();
