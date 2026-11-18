/* «Пожертви» — спільні помічники: кнопка «Копіювати», поява при скролі, тимчасовий перемикач варіантів */
(function(){
"use strict";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const ICON='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="2"/><path d="M10.5 3.5v-.2A1.8 1.8 0 0 0 8.7 1.5H3.8A1.8 1.8 0 0 0 2 3.3v4.9a1.8 1.8 0 0 0 1.8 1.8h.2"/></svg>';
const copyText=async t=>{
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  try{const a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();return ok}catch(e){return false}
};
window.DN={
  esc,
  copyBtn:(v,label)=>`<button class="copy" type="button" data-copy="${esc(v)}" aria-label="Копіювати: ${esc(label||v)}">${ICON}<span>Копіювати</span></button>`,
  init(opts){
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ft=document.getElementById("footer"); if(ft) ft.setAttribute("data-dark","");
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});
    document.querySelectorAll(".rv").forEach(el=>reduce?el.classList.add("in"):io.observe(el));
    document.addEventListener("click",async e=>{
      const b=e.target.closest("[data-copy]"); if(!b) return;
      const ok=await copyText(b.dataset.copy), s=b.querySelector("span"), old=b.dataset.t||(b.dataset.t=s.textContent);
      s.textContent=ok?"Скопійовано":"Не вдалося"; b.classList.toggle("ok",ok);
      clearTimeout(b._t); b._t=setTimeout(()=>{s.textContent=old;b.classList.remove("ok")},1600);
    });
    if(opts&&opts.switcher===false) return;
    // тимчасовий перемикач варіантів
    const V=[["A","donate.html"]];
    const here=location.pathname.split("/").pop()||"donate.html";
    const nav=document.createElement("nav");
    nav.className="vsw"; nav.setAttribute("aria-label","Варіанти сторінки");
    nav.innerHTML="<span>Варіант</span>"+V.map(([l,h])=>`<a href="${h}" data-no-u${h===here?' aria-current="page"':""}>${l}</a>`).join("");
    document.body.appendChild(nav);
  }
};
})();
