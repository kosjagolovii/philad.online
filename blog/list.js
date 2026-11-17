/* СПИСОК розділу (блог / відеобібліотека / архів подій) — ОДИН компонент для всіх.
   Сторінка лише задає налаштування й підключає дані:
     <script>window.PHILAD_LIST={kicker:"Блог",title:"Читати й дивитись",sub:"статті, свідоцтва, інтерв’ю",label:"Записи блогу",
       search:"Пошук…" (необов’язково), themesAll:"Усі теми", words:["запис","записи","записів"], empty:"…"}</script>
     <script src="blog/data.js"></script> <script src="blog/lib.js"></script> <script src="blog/list.js"></script>
   Розмітка списку, вкладки, теми, пошук, автопідвантаження — тут (+ blog/lib.js, blog/base.css, blog/list.css). */
(()=>{
const C=Object.assign({kicker:"",title:"",sub:"",label:"Записи",search:"",themesAll:"Усі теми",words:["запис","записи","записів"],
  empty:"Під цей вибір записів немає — спробуйте «Усі теми»."},window.PHILAD_LIST||{});
const B=window.PhiladBlog,el=B.el;
const root=document.getElementById("list-app");
root.className="bl";
root.innerHTML=`
  <header class="bl-top">
    <p class="bl-kicker rv"></p>
    <h1 class="rv" style="--d:1"></h1>
  </header>
  <section aria-label="">
    <div class="bl-tabs rv" id="tabs"></div>
    ${C.search?`<label class="bl-find rv"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="q" type="search" autocomplete="off"></label>`:""}
    <div class="a-bar rv">
      <div class="bl-chips" id="themes" role="group" aria-label="Теми"></div>
      <p class="bl-count" id="count"></p>
    </div>
    <div id="lead"></div>
    <ul class="a-grid" id="grid"></ul>
    <p class="bl-empty" id="empty" hidden></p>
    <div class="a-end"><button class="lbtn bl-more" id="more" type="button"></button></div>
  </section>`;
const $=id=>document.getElementById(id);
root.querySelector(".bl-kicker").textContent=C.kicker;
const h1=root.querySelector("h1");h1.append(C.title);if(C.sub)h1.append(document.createElement("br"),el("span",null,C.sub));
root.querySelector("section").setAttribute("aria-label",C.label);
$("empty").textContent=C.empty;
if(C.search){const q=$("q");q.placeholder=C.search;q.setAttribute("aria-label","Пошук");let t;q.addEventListener("input",e=>{clearTimeout(t);t=setTimeout(()=>B.set({q:e.target.value}),120)})}
const footer=document.getElementById("footer");if(footer)footer.setAttribute("data-dark","");

B.tabs($("tabs"));
if(Object.keys(B.THEMES).length)B.themes($("themes"),{all:C.themesAll});else $("themes").hidden=true;
const plural=n=>{const x=n%10,y=n%100;return x===1&&y!==11?C.words[0]:x>=2&&x<=4&&(y<12||y>14)?C.words[1]:C.words[2]};
const kick=p=>{const k=el("p","bl-k",B.kind(p));if(B.len(p)&&p.kind!=="video")k.append(" ",el("em",null,"· "+B.len(p)));return k};

function lead(p){
  const a=B.link(p,"a-lead bl-hov");
  const t=el("div","a-lead-t");t.append(kick(p),el("h2",null,p.title));
  if(p.text)t.append(el("p","t1",p.text));
  const f=el("div","a-foot");f.append(B.themeTags(p),el("time",null,B.date(p)));t.append(f);
  a.append(B.pic(p),t);return a}
function card(p,i){
  const li=el("li","rv in");li.style.setProperty("--d",i%3);
  const a=B.link(p,"a-card"),tx=el("span","a-tx");
  tx.append(kick(p),el("h3",null,p.title));
  if(p.text)tx.append(el("span","bl-line",p.text));
  const f=el("span","a-foot");f.append(B.themeTags(p),el("time",null,B.date(p)));tx.append(f);
  a.append(B.pic(p),tx);li.append(a);return li}

const page=B.pager($("more"),9);
B.onChange(list=>{
  $("count").textContent=list.length?`${list.length} ${plural(list.length)}`:"";
  $("empty").hidden=list.length>0;
  $("lead").replaceChildren(...(list.length?[lead(list[0])]:[]));
  const rest=list.slice(1);
  page(rest.length,n=>$("grid").replaceChildren(...rest.slice(0,n).map(card)));
});
})();
