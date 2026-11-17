/* тимчасовий перемикач варіантів сторінки «LIVE трансляція» (прибрати, коли варіант обрано) */
(function(){
const V=[["Основна","live.html"],["A","live-a.html"],["B","live-b.html"],["C","live-c.html"]];
const here=location.pathname.split("/").pop()||"live.html";
const st=document.createElement("style");
st.textContent='.vsw{position:fixed;z-index:20;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));translate:-50% 0;display:flex;align-items:center;gap:4px;padding:5px;border-radius:999px;background:rgba(20,20,20,.9);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.3);font:700 12px/1 Manrope,system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap}.vsw span{padding:0 8px 0 12px;color:rgba(247,242,232,.55)}.vsw a{padding:9px 14px;border-radius:999px;color:#F7F2E8;text-decoration:none}.vsw a:hover{background:rgba(247,242,232,.14)}.vsw a[aria-current]{background:#F7F2E8;color:#141414}@media (max-width:720px){.vsw span{display:none}}';
document.head.appendChild(st);
const nav=document.createElement("nav");nav.className="vsw";nav.setAttribute("aria-label","Варіанти сторінки");
nav.innerHTML="<span>Варіант</span>"+V.map(([l,h])=>`<a href="${h}" data-no-u${h===here?' aria-current="page"':""}>${l}</a>`).join("");
document.body.appendChild(nav);
})();
