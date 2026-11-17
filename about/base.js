/* «Про нас» — спільні помічники трьох варіантів: фото людей, поява при скролі, перемикач варіантів */
(function(){
"use strict";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const SIL='<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><circle cx="24" cy="17" r="9"/><path d="M6 44c0-10 8-16 18-16s18 6 18 16z"/></svg>';

window.AB={
  esc,
  // фото людини: kind "" — повний портрет, "w" — широке, "a" — аватар; без файла — заглушка
  photo(p,kind,attrs){
    const sfx=kind?"-"+kind:"";
    return p.img?`<img src="about/${esc(p.img)}${sfx}.webp" alt="${esc(p.name||"")}" loading="lazy" ${attrs||""}>`
                :`<span class="noph" title="Фото незабаром">${SIL}</span>`;
  },
  name:p=>p.name?esc(p.name):"Ім’я Прізвище",
  // після того, як сторінка намалювала розмітку
  init(){
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ft=document.getElementById("footer"); if(ft) ft.setAttribute("data-dark","");
    document.querySelectorAll(".nx-card").forEach((c,i)=>{c.classList.add("rv");c.style.setProperty("--d",i)});
    document.querySelectorAll(".nx-head").forEach(h=>h.classList.add("rv"));
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});
    document.querySelectorAll(".rv").forEach(el=>reduce?el.classList.add("in"):io.observe(el));

    // тимчасовий перемикач варіантів
    const V=[["Основна","about.html"],["A","about-a.html"],["B","about-b.html"],["B2","about-b2.html"],["B3","about-b3.html"],["C","about-c.html"]];
    const here=(location.pathname.split("/").pop()||"about.html");
    const nav=document.createElement("nav");
    nav.className="vsw"; nav.setAttribute("aria-label","Варіанти сторінки");
    nav.innerHTML="<span>Варіант</span>"+V.map(([l,h])=>`<a href="${h}" data-no-u${h===here?' aria-current="page"':""}>${l}</a>`).join("");
    document.body.appendChild(nav);
  }
};
})();
