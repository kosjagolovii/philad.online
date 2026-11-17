/* Сторінки за «чистими» адресами (/pro-nas/, /project/…) мають <base href="/">, тому посилання «#розділ» і «?параметр» без цього скрипта
   вели б на головну. Скрипт лишає їх на поточній сторінці. Підключає build-urls.py. */
(function(){
  document.addEventListener("click",function(e){
    if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target==="_blank")return;
    var h=a.getAttribute("href");
    if(h.charAt(0)==="?"){e.preventDefault();location.href=location.pathname+h;return}
    if(h.charAt(0)!=="#")return;
    e.preventDefault();
    var id=decodeURIComponent(h.slice(1)),t=id&&document.getElementById(id);
    if(h!==location.hash){history.pushState(null,"",location.pathname+location.search+h);dispatchEvent(new HashChangeEvent("hashchange"))}
    if(t)t.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});else if(!id)scrollTo(0,0);
  });
})();
