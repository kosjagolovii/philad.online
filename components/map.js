/* =====================================================================
   Філадельфія · карта «Як нас знайти» — спільний компонент <church-map>
   ---------------------------------------------------------------------
   Одна карта на весь сайт (була на «Ви вперше у нас»): статична картинка
   + жива карта MapLibre (OpenStreetMap / MapTiler у кольорах сайту),
   церква й метро «Голосіївська», кнопки +/−/«до церкви», «Прокласти маршрут».
   Підключення: <script src="components/map.js"></script> після site.js
   і <church-map></church-map> там, де має бути карта.
   Адреса й розклад беруться з SITE у site.js (window.SITE_DATA).
   ===================================================================== */
(function(){
"use strict";
const me=document.currentScript;
const BASE=new URL("../",me.src).href;
const asset=p=>BASE+p;
const S=window.SITE_DATA||{address:["м. Київ","вул. Голосіївська, 57"],schedule:["Неділя 11:00","Середа 19:00"]};
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

const style=document.createElement("style");
style.id="church-map-css";
style.textContent=`church-map{display:contents}
@property --mz{syntax:"<number>";inherits:true;initial-value:1}
/* map: the image keeps its own proportions and is centred on the church, so the pin stays on the address at any size */
.fv-map{position:relative;height:90vh;height:90svh;border-radius:20px;overflow:hidden;background:#232323;container-type:size;scroll-margin-top:110px}
.fv-map-in{position:absolute;left:50%;top:50%;width:max(100cqw,calc(100cqh*1.5644));aspect-ratio:2400/1534;--mz:2.1;transform:translate(calc(-1*var(--pin-x)),calc(-1*var(--pin-y))) scale(var(--mz));transform-origin:var(--pin-x) var(--pin-y);
  --pin-x:39.75%;--pin-y:54%;transition:--mz 1.6s cubic-bezier(.2,.7,.2,1)}
.fv-map.in .fv-map-in{--mz:1.7}
.fv-map-in>img{width:100%;height:100%;object-fit:cover}
.fv-pin{position:absolute;left:var(--pin-x);top:var(--pin-y);width:0;height:0;scale:calc(1/var(--mz,1))}   /* the church keeps its size while the map zooms */
/* soft pulse on the ground under the church */
.fv-pin::before,.fv-pin::after{content:"";position:absolute;left:0;top:0;width:46px;height:18px;margin:-9px 0 0 -23px;border-radius:50%;
  border:1px solid rgba(247,242,232,.55);opacity:0;animation:ring 3.2s cubic-bezier(.2,.7,.2,1) infinite}
.fv-pin::after{animation-delay:1.6s}
@keyframes ring{0%{transform:scale(.35);opacity:0}15%{opacity:.9}100%{transform:scale(1.6);opacity:0}}
.fv-church{position:absolute;left:0;bottom:2px;width:38px;max-width:none;height:auto;margin-left:-19px;transform-origin:50% 100%;
  filter:drop-shadow(0 4px 4px rgba(0,0,0,.55));opacity:0;transform:translateY(-24px) scale(.8)}
.fv-map.in .fv-church{animation:drop .9s cubic-bezier(.3,1.5,.5,1) .35s forwards, float 5s ease-in-out 1.4s infinite}
@keyframes drop{to{opacity:1;transform:none}}
@keyframes float{0%,100%{transform:none}50%{transform:translateY(-2px)}}
.fv-tag{position:absolute;left:0;top:12px;transform:translateX(-50%);white-space:nowrap;display:grid;justify-items:center;gap:2px;
  padding:10px 14px;border-radius:12px;background:var(--ds-cream);color:var(--ink);box-shadow:0 10px 30px rgba(0,0,0,.35);
  opacity:0;translate:0 8px;transition:opacity .5s ease 1.1s,translate .6s cubic-bezier(.2,.7,.2,1) 1.1s}
.fv-tag::before{content:"";position:absolute;left:50%;top:-5px;width:10px;height:10px;margin-left:-5px;background:inherit;rotate:45deg;border-radius:2px}
.fv-map.in .fv-tag{opacity:1;translate:0 0}
.fv-tag b{font-weight:700;font-size:15px;line-height:1.2;letter-spacing:-.02em}
.fv-tag span{font-weight:600;font-size:var(--t3-size);line-height:1.3;color:var(--mute)}
.fv-route{position:absolute;right:20px;bottom:20px;display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 20px;border-radius:12px;
  background:var(--ds-cream);color:var(--ink);font-weight:800;font-size:var(--t3-size);letter-spacing:.04em;text-transform:uppercase;text-decoration:none;
  transition:scale .35s cubic-bezier(.2,.7,.2,1)}
.fv-route:hover{scale:1.04}
.fv-route:focus-visible{outline:2px solid var(--ds-cream);outline-offset:3px}
.fv-route svg{width:16px;height:16px}
.fv-addr{position:absolute;left:20px;bottom:20px;margin:0;font-weight:600;font-size:var(--t2-size);line-height:1.35;color:rgba(247,242,232,.75)}
.fv-addr strong{display:block;font-weight:600;font-size:var(--t1-size);color:var(--ds-cream)}

/* live map (MapLibre): sits over the static picture and fades in once its tiles are ready */
.fv-map .fv-live{position:absolute;inset:0;opacity:0;transition:opacity .8s ease;background:#1b1d1f}
.fv-map.live .fv-live{opacity:1}
.fv-map .fv-live.maplibregl-map{position:absolute}
.fv-map.live .fv-map-in{visibility:hidden}
.fv-live .maplibregl-canvas{outline:none}
.fv-ctrl{position:absolute;right:20px;top:20px;z-index:2;display:grid;gap:8px;opacity:0;pointer-events:none;transition:opacity .4s ease}
.fv-map.live .fv-ctrl{opacity:1;pointer-events:auto}
.fv-ctrl button{width:44px;height:44px;display:grid;place-items:center;padding:0;border:0;border-radius:12px;background:var(--ds-cream);color:var(--ink);cursor:pointer;
  font:600 22px/1 var(--sans);transition:scale .3s cubic-bezier(.2,.7,.2,1),background .2s ease}
.fv-ctrl button:hover{scale:1.06;background:#fff}
.fv-ctrl button:focus-visible{outline:2px solid var(--ds-cream);outline-offset:3px}
.fv-ctrl svg{width:18px;height:18px}
.fv-route,.fv-addr{z-index:2}
.fv-addr{pointer-events:none}
/* church marker on the live map: same picture, fixed size at any zoom */
.fv-mk{position:relative;width:0;height:0}
.fv-mk .fv-church{opacity:1;transform:none;animation:float 5s ease-in-out infinite}
.fv-mk .fv-tag{opacity:1;translate:0 0;transition:none}
.fv-mk::before,.fv-mk::after{content:"";position:absolute;left:0;top:0;width:46px;height:18px;margin:-9px 0 0 -23px;border-radius:50%;
  border:1px solid rgba(247,242,232,.6);opacity:0;animation:ring 3.2s cubic-bezier(.2,.7,.2,1) infinite;pointer-events:none}
.fv-mk::after{animation-delay:1.6s}
/* metro station marker */
.fv-metro{display:flex;flex-direction:row-reverse;align-items:center;gap:7px;padding:4px 4px 4px 10px;border-radius:999px;background:rgba(20,20,20,.82);color:var(--ds-cream);
  font:600 13px/1 var(--sans);letter-spacing:-.01em;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.fv-metro i{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#2BA84A;color:#fff;font:800 var(--t3-size)/1 var(--sans);font-style:normal}
/* keep the library chrome quiet and on-brand */
.fv-live .maplibregl-ctrl-attrib{background:rgba(20,20,20,.55)!important;color:rgba(247,242,232,.6);font:500 10px/1.4 var(--sans)}
.fv-live .maplibregl-ctrl-attrib a{color:inherit}
.fv-live .maplibregl-ctrl-bottom-right{bottom:84px}
.fv-live .maplibregl-cooperative-gesture-screen{background:rgba(20,20,20,.55);color:var(--ds-cream);font:600 16px/1.4 var(--sans);border-radius:20px;padding:20px;text-align:center;display:flex;align-items:center;justify-content:center}
@media (max-width:720px){
  .fv-map{border-radius:16px}
  .fv-church{width:30px;margin-left:-15px}
  .fv-map.in .fv-map-in{--mz:1.5}
  .fv-addr{display:none}
  .fv-route{left:16px;right:16px;bottom:16px;justify-content:center}
  .fv-ctrl{right:16px;top:16px}
  .fv-live .maplibregl-ctrl-bottom-right{bottom:76px}
}
@media (prefers-reduced-motion:reduce){
  .fv-map-in,.fv-tag{transition:none!important}
  .fv-church{animation:none!important;opacity:1;transform:none}.fv-pin::before,.fv-pin::after{animation:none}
  .fv-route{transition:none}
}`;
document.head.appendChild(style);

class ChurchMap extends HTMLElement{
  connectedCallback(){
    if(this._ready)return;this._ready=true;
    const addr=S.address.join(", ");
    this.innerHTML=`<section class="fv-map row-w" id="map" aria-label="Як нас знайти: Київ, вул. Голосіївська, 57" data-dark>
    <div class="fv-map-in">
      <img src="${asset("first/map.webp")}" alt="Карта: церква «Філадельфія», вул. Голосіївська, 57, поряд зі станцією метро «Голосіївська» у Києві" width="2400" height="1534" loading="lazy">
      <div class="fv-pin">
        <img class="fv-church" src="${asset("first/church.webp")}" alt="Будівля церкви «Філадельфія»" width="360" height="331">
        <div class="fv-tag"><b>Церква «Філадельфія»</b><span>вул. Голосіївська, 57</span></div>
      </div>
    </div>
    <div class="fv-live" id="liveMap" aria-hidden="true"></div>
    <div class="fv-ctrl" role="group" aria-label="Керування картою">
      <button type="button" id="mapIn" aria-label="Наблизити">+</button>
      <button type="button" id="mapOut" aria-label="Віддалити">−</button>
      <button type="button" id="mapHome" aria-label="Показати церкву"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5Zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" fill="currentColor"/></svg></button>
    </div>
    <p class="fv-addr"><strong>${addr}</strong>${S.schedule.join(" · ")}</p>
    <a class="fv-route" data-no-u href="https://www.google.com/maps/dir/?api=1&amp;destination=%D0%9A%D0%B8%D1%97%D0%B2%2C+%D0%B2%D1%83%D0%BB.+%D0%93%D0%BE%D0%BB%D0%BE%D1%81%D1%96%D1%97%D0%B2%D1%81%D1%8C%D0%BA%D0%B0%2C+57" target="_blank" rel="noopener">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5Zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" fill="currentColor"/></svg>
      Прокласти маршрут
    </a>
  </section>`;
    const map=this.querySelector("#map");
    // map: zooms gently onto the church, then the church drops onto its spot
    new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){map.classList.add("in");o.disconnect();fly()}}),{threshold:.35}).observe(map);

/* ---------- live map: MapLibre GL + OpenStreetMap vector tiles ----------
   MAPTILER_KEY: вставте ключ MapTiler (cloud.maptiler.com → Account → Keys) — тоді карта бере стиль і дані MapTiler.
   Без ключа працює на OpenFreeMap (ті самі дані OpenStreetMap, без ліміту). Там, де зовнішні тайли заблоковані
   (наприклад, в артефакті claude.ai), лишається статична карта з церквою. */
const MAPTILER_KEY="4xnpIboEIZ8Se3POUMKB";   // MapTiler, ключ «philad.org»: дозволений лише для localhost і philad.org
const CHURCH=[30.51349,50.39785];   // вул. Голосіївська, 57 (OpenStreetMap)
const METRO=[30.50895,50.39752];    // метро «Голосіївська», вихід на Голосіївську площу
const STYLES=[MAPTILER_KEY&&`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,"https://tiles.openfreemap.org/styles/dark"].filter(Boolean);   // якщо MapTiler недоступний (ключ дозволений лише для philad.org) — запасна карта OpenFreeMap, як на «Домашніх групах»
const LIB="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/";
const loadLib=()=>new Promise((ok,no)=>{
  if(window.maplibregl)return ok();
  const l=document.createElement("link");l.rel="stylesheet";l.href=LIB+"maplibre-gl.css";document.head.append(l);
  const s=document.createElement("script");s.src=LIB+"maplibre-gl.js";s.onload=ok;s.onerror=no;document.head.append(s);
});
// brand palette over whatever OpenMapTiles-based style we get
const C={bg:"#1c1e1f",land:"#202324",park:"#1f2a26",water:"#173640",road:"#3d3e3d",major:"#5b5b59",label:"#F7F2E8",halo:"#141414",build:"#2a2f31"};
function brand(m){
  let buildSrc=null;
  for(const L of m.getStyle().layers){
    const id=L.id,sl=L["source-layer"]||"";
    try{
      if(L.type==="background")m.setPaintProperty(id,"background-color",C.bg);
      else if(L.type==="fill"&&sl==="water")m.setPaintProperty(id,"fill-color",C.water);
      else if(L.type==="fill"&&/park|landcover|landuse/.test(sl))m.setPaintProperty(id,"fill-color",/park|wood|grass/.test(id)?C.park:C.land);
      else if(L.type==="line"&&sl==="waterway")m.setPaintProperty(id,"line-color",C.water);
      else if(L.type==="line"&&sl==="transportation"){m.setPaintProperty(id,"line-color",/motorway|trunk|primary|major/.test(id)?C.major:C.road);m.setPaintProperty(id,"line-opacity",1)}   // opaque: no bright spots where road pieces overlap
      else if(L.type==="symbol"&&m.getLayoutProperty(id,"text-field")){
        if(/name/.test(JSON.stringify(m.getLayoutProperty(id,"text-field"))))m.setLayoutProperty(id,"text-field",["coalesce",["get","name:uk"],["get","name"]]);   // Ukrainian names
        m.setPaintProperty(id,"text-color",C.label);m.setPaintProperty(id,"text-halo-color",C.halo);m.setPaintProperty(id,"text-halo-width",1.2)}
      if(sl==="building"){buildSrc=L.source;if(L.type==="fill")m.setLayoutProperty(id,"visibility","none")}
    }catch(e){}
  }
  // 3D buildings
  if(buildSrc&&!m.getLayer("fv-3d"))m.addLayer({id:"fv-3d",type:"fill-extrusion",source:buildSrc,"source-layer":"building",minzoom:13,
    paint:{"fill-extrusion-color":C.build,"fill-extrusion-opacity":.92,
      "fill-extrusion-height":["interpolate",["linear"],["zoom"],13,0,14.5,["coalesce",["get","render_height"],8]],
      "fill-extrusion-base":["coalesce",["get","render_min_height"],0]}});
}
let live=null,flown=false;
const VIEW={center:CHURCH,zoom:15.6,pitch:52,bearing:-18};
async function startLive(i=0){
  const STYLE=STYLES[i];if(!STYLE)return;                  // джерела скінчились → лишається статична карта
  const next=()=>startLive(i+1);
  try{
    const r=await fetch(STYLE);if(!r.ok)throw 0;          // blocked or offline → next source
    await loadLib();
    const m=new maplibregl.Map({container:"liveMap",style:STYLE,center:[30.52,50.43],zoom:10.6,pitch:0,bearing:0,
      attributionControl:{compact:true},cooperativeGestures:true,dragRotate:true,maxZoom:18.5,minZoom:8,
      locale:{"CooperativeGesturesHandler.WindowsHelpText":"Щоб змінити масштаб, тримайте Ctrl і крутіть коліщатко",
              "CooperativeGesturesHandler.MacHelpText":"Щоб змінити масштаб, тримайте ⌘ і крутіть коліщатко",
              "CooperativeGesturesHandler.MobileHelpText":"Рухайте карту двома пальцями"}});
    let ok=false;const giveUp=()=>{if(ok)return;try{m.remove()}catch(e){}next()};
    const timer=setTimeout(giveUp,12000);                  // карта не завантажилась за 12 с → наступне джерело
    m.on("error",e=>{const c=e&&e.error&&e.error.status;if(!ok&&(c===401||c===403||c===429)){clearTimeout(timer);giveUp()}});
    live=m;
    const el=document.createElement("div");el.className="fv-mk";
    el.innerHTML='<img class="fv-church" src="'+asset("first/church.webp")+'" alt="Будівля церкви «Філадельфія»" width="360" height="331"><div class="fv-tag"><b>Церква «Філадельфія»</b><span>вул. Голосіївська, 57</span></div>';
    m.on("style.load",()=>brand(m));
    m.once("load",()=>{
      ok=true;clearTimeout(timer);
      new maplibregl.Marker({element:el,anchor:"center"}).setLngLat(CHURCH).addTo(m);
      const mt=document.createElement("div");mt.className="fv-metro";mt.innerHTML='<i aria-hidden="true">M</i>Метро «Голосіївська»';
      new maplibregl.Marker({element:mt,anchor:"right",offset:[15,0]}).setLngLat(METRO).addTo(m);
      map.classList.add("live");document.getElementById("liveMap").removeAttribute("aria-hidden");
      document.querySelectorAll("#liveMap .maplibregl-compact-show").forEach(n=>n.classList.remove("maplibregl-compact-show"));   // credits folded into the ⓘ button
      if(map.classList.contains("in"))fly();
    });
    m.on("error",e=>{if(!map.classList.contains("live"))console.warn("map",e&&e.error)});
  }catch(e){next()}
}
function fly(){if(!live||flown)return;flown=true;live.flyTo({...VIEW,duration:reduce?0:4200,curve:1.5,essential:true})}
document.getElementById("mapIn").onclick=()=>live&&live.zoomIn();
document.getElementById("mapOut").onclick=()=>live&&live.zoomOut();
document.getElementById("mapHome").onclick=()=>live&&live.flyTo({...VIEW,duration:reduce?0:1800});

    // load the map library only when the visitor gets close to the map
    new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting){o.disconnect();startLive()}}),{rootMargin:"600px 0px"}).observe(map);
  }
}
if(!customElements.get("church-map"))customElements.define("church-map",ChurchMap);
})();
