/* Спільний лайтбокс: PhiladLightbox.open(imgs, k) · PhiladLightbox.attach(imgs). Стилі — components/lightbox.css */
(()=>{
const X='<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l12 12M15 3L3 15"/></svg>';
const A='<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
let lb,im,ct,list=[],k=0,last=null;
function build(){
  lb=document.createElement("div");lb.className="lb";lb.setAttribute("role","dialog");lb.setAttribute("aria-modal","true");
  lb.innerHTML='<button class="lb-x" aria-label="Закрити">'+X+'</button><button class="lb-pv" aria-label="Попереднє">'+A+'<path d="M18 11H4M10 5l-6 6 6 6"/></svg></button><img alt=""><button class="lb-nx" aria-label="Наступне">'+A+'<path d="M4 11h14M12 5l6 6-6 6"/></svg></button><div class="lb-ct"></div>';
  document.body.append(lb);im=lb.querySelector("img");ct=lb.querySelector(".lb-ct");
  lb.addEventListener("click",e=>{if(e.target===lb||e.target.closest(".lb-x"))close();else if(e.target.closest(".lb-pv"))step(-1);else if(e.target.closest(".lb-nx"))step(1)});
  addEventListener("keydown",e=>{if(!lb.classList.contains("open"))return;if(e.key==="Escape")close();else if(e.key==="ArrowLeft")step(-1);else if(e.key==="ArrowRight")step(1)});
  let sx=null;lb.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});
  lb.addEventListener("touchend",e=>{if(sx==null||list.length<2)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)step(dx<0?1:-1);sx=null});
}
function show(){const f=list[k];im.src=f.currentSrc||f.src;im.alt=f.alt||"";ct.textContent=(k+1)+" / "+list.length}
function step(d){k=(k+d+list.length)%list.length;show()}
function close(){lb.classList.remove("open");document.documentElement.style.overflow="";if(last&&last.focus)last.focus()}
function open(imgs,i){if(!lb)build();list=[...imgs];k=Math.max(0,i||0);lb.classList.toggle("one",list.length<2);last=document.activeElement;show();lb.classList.add("open");document.documentElement.style.overflow="hidden";lb.querySelector(".lb-x").focus()}
function attach(imgs){const a=[...imgs];a.forEach((x,i)=>x.addEventListener("click",()=>open(a,i)))}
window.PhiladLightbox={open,attach};
})();
