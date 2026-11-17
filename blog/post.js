/* СТОРІНКА ЗАПИСУ — поведінка (одна для блогу, відеобібліотеки й архіву подій):
   відео після натискання, збільшення зображень, розмір тексту, зміст, колір футера. */
(()=>{
const footer=document.getElementById("footer");if(footer)footer.setAttribute("data-dark","");

/* відео: кадр → плеєр YouTube після натискання (youtube-nocookie) */
document.querySelectorAll(".yt").forEach(b=>b.addEventListener("click",()=>{
  b.parentNode.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+b.dataset.yt+'?autoplay=1&rel=0" title="Відео" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'}));

/* збільшення зображень по кліку: ← → і Esc */
const IM=[...document.querySelectorAll(".hero:not(.vid) img,.art .pic img")];
if(IM.length&&window.PhiladLightbox)PhiladLightbox.attach(IM);

/* зміст зліва: підсвічує розділ, до якого дійшли */
const L=[...document.querySelectorAll(".toc a")],S=L.map(a=>document.getElementById(a.hash.slice(1)));
if(L.length){
  L.forEach((a,i)=>a.addEventListener("click",e=>{e.preventDefault();S[i].scrollIntoView({behavior:"smooth"})}));
  const on=()=>{let k=-1;S.forEach((s,i)=>{if(s.getBoundingClientRect().top<160)k=i});L.forEach((a,i)=>a.classList.toggle("on",i===k))};
  addEventListener("scroll",on,{passive:true});on();
}

/* розмір тексту (A / A): ±2 px за крок, запам'ятовується в браузері */
const fz=document.querySelector(".fz");
if(fz){
  let z=0;try{z=+localStorage.getItem("blog-fz")||0}catch(e){}
  const root=document.documentElement,base=getComputedStyle(root).getPropertyValue("--b1-size").trim()||"19px";
  const set=()=>root.style.setProperty("--b1-size",`calc(${base} + ${z*2}px)`);set();
  fz.addEventListener("click",e=>{const d=+((e.target.closest("button")||{}).dataset||{}).d;if(!d)return;z=Math.max(-2,Math.min(3,z+d));set();try{localStorage.setItem("blog-fz",z)}catch(e){}});
}
})();
