/* =====================================================================
   Філадельфія · спільні компоненти сайту: шапка з меню + футер
   ---------------------------------------------------------------------
   Один файл на весь сайт. Щоб компоненти з'явились на сторінці:
     1) у <head>, ДО власних стилів сторінки:
          <script src="components/site.js"></script>
     2) у <body> там, де мають бути шапка і футер:
          <site-menu></site-menu>
          ...
          <site-next></site-next>       ← блок «А що мені далі робити?» (за потреби)
          <site-footer></site-footer>
   Тексти, посилання, розклад і соцмережі — у блоці SITE нижче:
   змінюєте тут — змінюється на всіх сторінках.
   ФУТЕР ВИЇЖДЖАЄ З-ПІД ОСТАННЬОГО БЛОКУ (патерн для кожної сторінки): футер — position:sticky;bottom:0 під усім;
   блок над ним (зазвичай <main>) має position:relative, z-index вище за футер і власний непрозорий фон.
   Компонент <site-footer> сам доводить до цього <main> перед ним, тож на новій сторінці достатньо
   <main>…</main><site-footer></site-footer>. Якщо сторінка загортає футер у .end — .end не має перекривати main.
   Сторінка може перефарбувати шапку класом .light на .bar
   (темне лого для світлого фону) — це робить сама сторінка.
   ===================================================================== */
(function(){
"use strict";

const SITE={
  schedule:["Неділя 11:00","Середа 19:00"],
  email:"info@philad.org",
  // адреса, куди сторінка «Контакти» надсилає заявки (POST, JSON: name, contact, message). Поки порожньо — форма відкриває поштову програму з готовим листом на email вище.
  // куди потрапляють дані з усіх форм сайту (контакти, «Пошук Бога», заявки на служіння). Змінити адресу — лише тут.
  // Відправка іде через сервіс formsubmit.co: перший лист після зміни адреси просить власника пошти один раз підтвердити її.
  formEmail:"media@philad.org",
  formEndpoint:"",
  address:["м. Київ","вул. Голосіївська, 57"],
  handle:"@philadkyiv",
  copyright:"© 2026 — Церква «Філадельфія». Всі права захищені",
  privacy:{label:"Політика конфіденційності",href:"/privacy-policy/"},
  menuTitle:"Наші служіння",
  more:{label:"Дізнатись більше",href:"/sluzhinnya/"},
  // адреси відносно папки сайту: "сторінка.html" або "сторінка.html#секція"; "#footer" — футер на поточній сторінці.
  // поки окремих сторінок немає, частина пунктів веде на секції головної (/#…)
  menu:[
    {label:"Ви вперше у нас?",href:"/first-visit/"},
    {label:"Про нас",href:"/pro-nas/"},
    {label:"Історія церкви",href:"/history/"},
    {label:"Служіння",href:"/sluzhinnya/"},
    {label:"Домашні групи",href:"/domashnie-gruppy/"},
    {label:"Події",href:"/cobytiya/"},
    {label:"Пожертви",href:"/donate/"},
    {label:"Контакти",href:"/contacts/"}
  ],
  useful:[
    {label:"LIVE трансляція",href:"/online-translyaciya/"},
    {label:"Теми домашніх груп",href:"/zavhdi_molytysya_i_ne_zanepadaty_duhom/"},
    {label:"Проповіді",href:"/category/sermon/"},
    {label:"Пошук Бога",href:"/poshuk-boga/"},
    {label:"Блог",href:"/category/vse_zapisi/"},
    {label:"Відеобібліотека",href:"/video/"},
    {label:"Архів подій",href:"/events/"}
  ],
  // блок «А що мені далі робити?» — однаковий на всіх сторінках, де стоїть <site-next>
  next:{
    title:"А що мені далі робити?",
    text:"Якщо ви вперше у нас, заповніть форму, і ми з вами звʼяжемось. Або приходьте до нас на недільне служіння.",
    cards:[
      {label:"Запрошуємо на курс",title:"Перші кроки у вірі",text:"Для тих, хто тільки робить перші кроки з Богом, хоче прийняти водне хрещення, планує перейти з іншої церкви або просто прагне більше дізнатися про основи християнського віровчення, в церкві «Філадельфія» проходять особливі зустрічі. Вони проходять у формі колективних обговорень у дружній атмосфері.",button:"Записатись на курс",href:"#course"},
      {label:"Ви у нас вперше? Запишіться на",title:"Домашні групи",text:"Перегляньте домашні групи і виберіть, яка вам краще підходить за віком і місцем проведення.",button:"Переглянути домашні групи",href:"/domashnie-gruppy/"},
      {label:"Добровільні пожертвування",title:"Пожертву&shy;вати",text:"Для здійснення усієї цієї праці церква дуже потребує матеріальних ресурсів. Якщо Господь покладе вам на серце матеріально підтримати церковні служіння, переходьте до реквізитів, за допомогою яких ви можете послужити фінансово.",button:"Пожертвувати",href:"/donate/"},
      {label:"Контакти",title:"Зв’язатися з нами",text:"Якщо у вас є питання або пропозиції, можете залишити їх у формі, натиснувши на кнопку нижче.",button:"Контакти",href:"/contacts/"}
    ]
  },
  social:[
    {label:"YouTube",href:"https://www.youtube.com/@philadkyiv",icon:"youtube"},
    {label:"Instagram",href:"https://www.instagram.com/philadkyiv",icon:"instagram"},
    {label:"Facebook",href:"https://www.facebook.com/philadkyiv/",icon:"facebook"},
    {label:"Telegram",href:"https://t.me/philadkyiv",icon:"telegram",small:true}
  ]
};

window.SITE_DATA=SITE;
// SITE.send(тема, {поле: значення}) — надіслати дані форми на SITE.formEmail. На localhost нічого не відправляє (лише пише в консоль).
SITE.send=async(subject,fields)=>{
  if(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(location.hostname)){console.info("[форма, локально не надсилається]",subject,fields);return}
  if(!SITE.formEmail)throw new Error("no-target");
  const body={_subject:subject,_template:"table",_captcha:"false",...fields};
  const mail=Object.values(fields).map(v=>String(v||"").trim()).find(v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
  if(mail)body._replyto=mail;
  const r=await fetch("https://formsubmit.co/ajax/"+encodeURIComponent(SITE.formEmail),{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||String(j.success)==="false")throw new Error(j.message||("HTTP "+r.status));
};   // дані сайту доступні іншим компонентам (карта, сторінка «Контакти»)

/* ---------- нижче — розмітка, стилі й поведінка; зазвичай редагувати не треба ---------- */
const me=document.currentScript;
const BASE=new URL("../",me.src).href;           // папка сайту: картинки беруться звідси на будь-якій сторінці
const asset=p=>BASE+p;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const ext=h=>/^https?:/.test(h);
const link=(l,attrs="")=>`<a href="${esc(l.href)}"${ext(l.href)?' target="_blank" rel="noopener"':""}${attrs}><span class="u">${esc(l.label)}</span></a>`;
const social=extra=>`<div class="ft-soc"${extra||""}>${SITE.social.map(s=>`<a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}"><img${s.small?' class="s"':""} src="${asset("b9/"+s.icon+".svg")}" alt="" width="44" height="44"></a>`).join("")}</div>`;
const sched=SITE.schedule.map(esc).join("<br>");

const style=document.createElement("style");
style.id="site-components";
style.textContent=`@font-face{font-family:"Manrope";src:url("${asset("fonts/Manrope-VariableFont_wght.ttf")}") format("truetype");font-weight:200 800;font-style:normal;font-display:swap}
site-menu,site-footer,site-next{display:contents}
/* СІТКА САЙТУ — одна для всіх сторінок.
   --cw  ширина картки (4 в ряд на десктопі, 2 на планшеті й телефоні)
   --row ширина контенту: 4 картки + проміжки; усі блоки контенту мають цю ширину (клас .row-w або width:var(--row))
   --gutter мінімальний бічний відступ */
:root{--gutter:50px;--cw:min(calc((100vw - 2*max(40px,var(--gutter)) - 42px)/4),calc((100svh - 200px)*.73));--row:calc(4*var(--cw) + 42px)}
@media (min-width:721px) and (max-width:1000px){:root{--cw:min(calc((100vw - 2*var(--gutter) - 14px)/2),calc((100svh - 230px)/2*.73));--row:calc(100vw - 2*var(--gutter))}}
@media (max-width:720px){:root{--cw:min(calc((100vw - 32px - 10px)/2),calc((100svh - 150px)/2*.73));--row:calc(2*var(--cw) + 10px)}}
.row-w{width:var(--row);max-width:100%;margin-inline:auto;box-sizing:border-box}
/* кнопка сайту */
.lbtn{--teal:#317C8E;display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 33px;border-radius:12px;background:var(--teal);color:var(--ds-cream,#F7F2E8);font:var(--t3-weight) var(--t3-size)/var(--t3-lh) var(--font);letter-spacing:var(--t3-track);text-transform:uppercase;text-decoration:none;white-space:nowrap;transition:scale .35s cubic-bezier(.2,.7,.2,1),background .25s ease}
.lbtn:hover{scale:1.04;background:#28697A}
.lbtn:focus-visible{outline:2px solid #141414;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.lbtn{transition:none}}
/* блок «А що мені далі робити?»; ширину картки --cw задає сторінка */
.nx{--teal:#317C8E;background:var(--teal);color:#F7F2E8;box-sizing:border-box;
  display:grid;justify-items:center;gap:60px;padding-block:90px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.nx-head{display:grid;justify-items:center;gap:24px;text-align:center;min-width:0}
.nx-head h2{margin:0;font:var(--h2-weight) var(--h2-size)/var(--h2-lh) var(--font);letter-spacing:var(--h2-track);text-wrap:balance;color:#F7F2E8}
.nx-head p{margin:0;max-width:494px;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:#F7F2E8;opacity:.85}
.nx-row{position:relative;max-width:100%;display:grid;grid-template-columns:repeat(4,var(--cw));gap:14px;justify-content:center}
.nx-card{box-sizing:border-box;min-height:calc(var(--cw)*452/330);padding:28px 24px 24px;border-radius:20px;will-change:transform,opacity;background:#E8E7DB;color:#141414;
  display:flex;flex-direction:column;justify-content:space-between;gap:32px;min-width:0}
.nx-text{display:grid;gap:16px}
.nx-text small{font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:rgba(20,20,20,.5)}
.nx-text h3{margin:0;font:var(--h2-weight) var(--h2-size)/var(--h2-lh) var(--font);letter-spacing:var(--h2-track);hyphens:manual;overflow-wrap:break-word}
.nx-text p{margin:0;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:rgba(20,20,20,.5)}
.nx-card .lbtn{width:100%;box-sizing:border-box;padding:0 12px;white-space:normal;text-align:center}
@media (max-width:1000px){.nx-row{grid-template-columns:repeat(2,var(--cw))}.nx-text h3{font-size:var(--h2s-size)}}
@media (max-width:900px){.nx{padding-top:104px}}
@media (max-width:720px){.nx{padding-block:72px 64px;gap:40px}.nx-row{width:100%;grid-template-columns:minmax(0,1fr);gap:10px}.nx-card{min-height:0;border-radius:16px}.nx-text h3{font-size:var(--h2s-size)}}
/* header */
.bar{position:fixed;z-index:10;transition:transform .45s cubic-bezier(.2,.7,.2,1);top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;
  padding-top:calc(30px + env(safe-area-inset-top,0px));
  padding-left:max(var(--gutter),env(safe-area-inset-left,0px));padding-right:max(var(--gutter),env(safe-area-inset-right,0px))}
.brand{display:block;line-height:0;border-radius:21px}
.brand img{width:210px;height:42px}
.menu{display:block;line-height:0;padding:0;border:0;background:none;cursor:pointer;border-radius:20px}
.menu svg{width:96px;height:40px;display:block;overflow:visible}
.menu .mt{fill:var(--ds-cream)}
.menu .mc{fill:var(--ds-cream);transition:fill .25s ease}
.menu .ml{fill:#000;transition:fill .25s ease}
.menu:hover .mc,.menu.is-hot .mc{fill:#000}
.menu:hover .ml,.menu.is-hot .ml{fill:var(--ds-cream)}
.brand,.menu{transition:scale .35s cubic-bezier(.2,.7,.2,1)}
.brand:hover,.menu:hover{scale:1.05}
.menu:focus-visible,.brand:focus-visible{outline:2px solid var(--ds-cream);outline-offset:3px}
/* ПОСИЛАННЯ — єдиний стиль на весь сайт: підкреслення з'являється зліва направо і зникає теж зліва направо.
   Текстові посилання без класу отримують <span class="u"> автоматично; кнопкам/карткам з класом або атрибутом data-no-u — не додається. */
.u{position:relative;display:inline-block}
.u::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:right center;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
a:hover .u::after,a:focus-visible .u::after{transform:scaleX(1);transform-origin:left center}
@media (prefers-reduced-motion:reduce){.u::after{transition:none}}
/* header over paper */
.brand .on-dark,.brand .on-light{transition:opacity .35s ease,filter .35s ease}
.brand .on-light{position:absolute;left:0;top:0;opacity:0}
.brand{position:relative}
.bar.away{transform:translate3d(0,-110%,0)}
.bar.away.nav-open{transform:none}
.bar.light .brand .on-dark{opacity:0}.bar.light .brand .on-light{opacity:1}
.bar.light .menu .mt{fill:#14110F}
.bar.light .menu .mc{fill:#fff}
.bar.light .menu:hover .mc,.bar.light .menu.is-hot .mc{fill:#14110F}
/* ---------- menu ---------- */
/* the word «Меню» fades out, the two burger lines fold into a cross inside the same circle */
.menu .mt{transition:fill .35s ease,opacity .3s ease,transform .45s cubic-bezier(.2,.7,.2,1)}
.menu .ml{transform-box:view-box;transform-origin:76px 20px;transition:fill .25s ease,transform .5s cubic-bezier(.7,0,.2,1)}
.bar.nav-open .menu .mt{opacity:0;transform:translateX(10px)}
.bar.nav-open .menu .ml1{transform:rotate(45deg) translateY(3px)}
.bar.nav-open .menu .ml2{transform:rotate(-45deg) translateY(-3px)}
.bar.nav-open.nav-open .brand .on-dark{opacity:1;filter:brightness(0) invert(1)}.bar.nav-open.nav-open .brand .on-light{opacity:0}
.bar.nav-open.nav-open .menu .mc{fill:var(--ds-cream)}
.bar.nav-open.nav-open .menu .ml{fill:#000}
.bar.nav-open.nav-open .menu:hover .mc,.bar.nav-open.nav-open .menu.is-hot .mc{fill:#000}.bar.nav-open.nav-open .menu:hover .ml,.bar.nav-open.nav-open .menu.is-hot .ml{fill:var(--ds-cream)}
.nav-dim{position:fixed;inset:0;z-index:8;background:transparent;opacity:0;visibility:hidden;
  transition:opacity .5s ease,visibility 0s linear .5s}
.nav{position:fixed;left:0;right:0;top:0;z-index:9;max-height:100vh;max-height:100svh;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;
  background:#317C8E;color:var(--ds-cream);border-radius:0 0 20px 20px;transform:translate3d(0,-102%,0);visibility:hidden;
  transition:transform .6s cubic-bezier(.7,0,.2,1),visibility 0s linear .6s;
  padding-block:calc(120px + env(safe-area-inset-top,0px)) 60px;
  padding-left:max(var(--gutter),env(safe-area-inset-left,0px));padding-right:max(var(--gutter),env(safe-area-inset-right,0px))}
.nav.open{transform:none;visibility:visible;transition:transform .75s cubic-bezier(.7,0,.2,1),visibility 0s}
.nav-dim.open{opacity:1;visibility:visible;transition:opacity .5s ease}
.nav-in{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:48px 40px}
/* desktop: the panel is at least 70% of the screen tall; the left side (title, schedule, social) stretches the whole height
   with the icons at the bottom, the two link columns sit at the top */
@media (min-width:901px){
  .nav{display:flex;flex-direction:column;min-height:70vh;min-height:70svh;padding-block:160px 90px}
  .nav-in{flex:1;align-items:stretch}
  .nav-cols{align-self:start}
}
.nav-info{display:flex;flex-direction:column;gap:40px;min-width:0}
.nav-info .nav-title{margin:0;font:var(--h2-weight) var(--h2-size)/var(--h2-lh) var(--font);letter-spacing:var(--h2-track)}
.nav-time{display:grid;gap:4px;justify-items:start}
.nav-time p{margin:0;font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font);letter-spacing:var(--h3-track)}
.nav-time a{font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:rgba(247,242,232,.5);text-decoration:none}
.nav-time a:hover{color:var(--ds-cream)}
.nav-info .ft-soc{margin-top:auto}
.nav-cols{display:flex;gap:40px clamp(32px,4.8vw,69px)}
.nav-col{width:clamp(200px,20.8vw,300px);display:grid;gap:24px;align-content:start}
.nav-col h3{margin:0;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);text-transform:uppercase}
.nav-col ul{list-style:none;margin:0;padding:0;display:grid;gap:16px;justify-items:start}
.nav-col a{font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font);letter-spacing:var(--h3-track);color:inherit;text-decoration:none}
.nav:focus{outline:none}
.nav a:focus-visible{outline:2px solid var(--ds-cream);outline-offset:4px}
/* content rises in a short stagger after the panel lands */
.nav [data-i]{opacity:0;transform:translate3d(0,14px,0);transition:opacity .25s ease,transform .25s ease}
.nav.open [data-i]{opacity:1;transform:none;transition:opacity .5s ease calc(.32s + var(--i)*.035s),transform .6s cubic-bezier(.2,.7,.2,1) calc(.32s + var(--i)*.035s)}
@media (max-width:900px){
  .nav{padding-block:calc(110px + env(safe-area-inset-top,0px)) 48px}
  .nav-in{grid-template-columns:minmax(0,1fr)}
  .nav-cols{order:-1}
  .nav-col{width:auto;flex:1 1 0;min-width:0}
  .nav-info{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:16px 24px}
  .nav-info .nav-title{grid-column:1;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track)}
  .nav-time{grid-column:1}
  .nav-info .ft-soc{grid-column:2;grid-row:2;margin:0}
}
@media (max-width:720px){
  .nav{height:100vh;height:100svh;border-radius:0;padding-block:calc(96px + env(safe-area-inset-top,0px)) calc(32px + env(safe-area-inset-bottom,0px));
    padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
  .nav-in{gap:30px}
  .nav-cols{flex-direction:column;gap:30px}
  .nav-col{gap:16px}
  .nav-col ul{gap:10px}
  .nav-col a{font-size:var(--h3-size)}
  .nav-info{display:flex;align-items:flex-start;gap:14px}
  .nav-time p{font-size:var(--h3-size)}
  .nav-info .ft-soc{margin-top:16px}
}
@media (prefers-reduced-motion:reduce){.nav,.nav.open,.nav-dim,.nav [data-i],.nav.open [data-i],.menu .ml,.menu .mt{transition:none}}
@media (max-width:720px){
  .bar{padding-top:calc(18px + env(safe-area-inset-top,0px));padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
  .brand img{width:160px;height:32px}
  .menu svg{width:86px;height:36px}
}
@media (prefers-reduced-motion:reduce){.brand,.menu{transition:none}}
/* block 9 · footer: pinned to the bottom underneath block 8, which scrolls away and uncovers it */
.ft{position:relative;z-index:0;background:#141414;color:var(--ds-cream);box-sizing:border-box;display:grid;justify-items:center;padding-block:clamp(60px,10vh,90px) 40px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
/* футер на всіх сторінках: стоїть на місці внизу, а блок перед ним (z-index вище, власний фон) відкриває його по скролу.
   Вищий за екран футер прокручується звичайно, щоб нічого не обрізалось */
.ft{position:sticky;bottom:0}
.ft.tall{position:relative}
@media (min-width:901px){.ft-top{flex-wrap:nowrap}.ft-nav{flex-wrap:nowrap}}
.ft-in{width:var(--row);max-width:100%;display:flex;flex-direction:column;justify-content:space-between;gap:clamp(32px,6vh,69px);min-width:0}
.ft-top{display:flex;justify-content:space-between;align-items:flex-start;gap:48px 40px;flex-wrap:wrap}
.ft-about{display:grid;gap:clamp(36px,6vh,80px);justify-items:start;min-width:0}
.ft-logo{display:flex;align-items:center;gap:9px}
.ft-logo .m{width:57px;height:57px}
.ft-logo span{display:grid;gap:4px}
.ft-logo .w{width:162px;height:19px}
.ft-logo small{padding-left:3px;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:rgba(247,242,232,.6)}
.ft-contact{display:grid;gap:40px;justify-items:start}
.ft-mail{font:var(--h2-weight) var(--h2-size)/var(--h2-lh) var(--font);letter-spacing:var(--h2-track);color:inherit;text-decoration:none;overflow-wrap:anywhere}
.ft-addr{margin:0;font-style:normal;font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font);letter-spacing:var(--h3-track)}
.ft-time{margin:0;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:#9A9A8D}
.ft-soc{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.ft-soc a{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;transition:scale .35s cubic-bezier(.2,.7,.2,1)}
.ft-soc a:hover{scale:1.1}
.ft-soc img{width:44px;height:44px;display:block}
.ft-soc img.s{width:34.3px;height:34.3px}
.ft-nav{display:flex;gap:40px clamp(32px,4.8vw,69px);flex-wrap:wrap}
.ft-col{width:clamp(180px,20.8vw,300px);max-width:100%;display:grid;gap:24px;align-content:start}
.ft-col h3{margin:0;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:#9A9A8D;text-transform:uppercase}
.ft-col ul{list-style:none;margin:0;padding:0;display:grid;gap:16px;justify-items:start}
.ft-col a{font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font);letter-spacing:var(--h3-track);color:inherit;text-decoration:none}
.ft-bot{display:flex;justify-content:space-between;align-items:center;gap:12px 24px;flex-wrap:wrap;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font);letter-spacing:var(--t2-track);color:#9A9A8D}
.ft-bot a{color:inherit;text-decoration:none}
.ft a:focus-visible{outline:2px solid var(--ds-cream);outline-offset:4px}
@media (max-width:900px){.ft{padding-block:104px 32px}.ft-about{gap:48px}.ft-col{width:auto;min-width:200px}.ft-col a,.ft-addr{font-size:var(--h3-size)}}
@media (max-width:720px){
  .ft{padding-block:92px 22px}
  .ft-in{gap:22px}
  .ft-top{flex-direction:column;gap:26px}
  .ft-about{gap:18px}
  .ft-logo .m{width:44px;height:44px}
  .ft-logo .w{width:130px;height:15.4px}
  .ft-logo small{font-size:var(--t3-size)}
  .ft-contact{gap:10px}
  .ft-mail{font-size:var(--h2s-size)}
  .ft-addr{font-size:var(--t1-size)}
  .ft-time{font-size:var(--t2-size)}
  .ft-soc{gap:10px}
  .ft-soc a,.ft-soc img{width:38px;height:38px}
  .ft-soc img.s{width:30px;height:30px}
  .ft-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;width:100%}
  .ft-col{width:auto;min-width:0;gap:12px}
  .ft-col ul{gap:9px}
  .ft-col a{font-size:var(--t1-size)}
  .ft-bot{gap:6px 16px;font-size:var(--t3-size)}
}
@media (prefers-reduced-motion:reduce){.ft-soc a{transition:none}}`;
me.before(style);   // ставимо перед стилями сторінки, щоб сторінка могла їх перекрити

const SVG=`<svg viewBox="0 0 96 40" aria-hidden="true"><path class="mt" d="M1.40838 25V15.2H4.95038L6.70038 20.478H6.85438L8.60438 15.2H12.1464V25H9.68238V18.238H9.54238L7.68038 23.74H5.87438L3.99838 18.238H3.87238V25H1.40838ZM14.0822 25V15.2H20.4382V17.384H16.6162V19.092H20.1582V21.136H16.6162V22.816H20.5782V25H14.0822ZM22.2717 25V15.2H24.8057V18.952H28.1097V15.2H30.6577V25H28.1097V21.136H24.8057V25H22.2717ZM41.0079 25.21C40.3919 25.21 39.8133 25.1073 39.2719 24.902C38.7399 24.6967 38.2639 24.412 37.8439 24.048C37.4333 23.6747 37.0879 23.236 36.8079 22.732C36.5279 22.228 36.3413 21.6773 36.2479 21.08H35.1279V25H32.5939V15.2H35.1279V19.008H36.2619C36.3646 18.42 36.5559 17.8833 36.8359 17.398C37.1159 16.9033 37.4613 16.4787 37.8719 16.124C38.2919 15.7693 38.7679 15.494 39.2999 15.298C39.8319 15.0927 40.4013 14.99 41.0079 14.99H41.1899C41.8806 14.99 42.5199 15.1207 43.1079 15.382C43.7053 15.634 44.2186 15.984 44.6479 16.432C45.0866 16.88 45.4273 17.412 45.6699 18.028C45.9126 18.6347 46.0339 19.288 46.0339 19.988V20.198C46.0339 20.9073 45.9079 21.57 45.6559 22.186C45.4133 22.7927 45.0773 23.3247 44.6479 23.782C44.2186 24.23 43.7053 24.58 43.1079 24.832C42.5199 25.084 41.8806 25.21 41.1899 25.21H41.0079ZM38.7819 20.016V20.184C38.7819 20.6133 38.8426 21.0053 38.9639 21.36C39.0853 21.7053 39.2439 22.004 39.4399 22.256C39.6453 22.508 39.8833 22.704 40.1539 22.844C40.4246 22.9747 40.7139 23.04 41.0219 23.04H41.1759C41.4839 23.04 41.7733 22.9747 42.0439 22.844C42.3239 22.704 42.5619 22.508 42.7579 22.256C42.9633 22.004 43.1219 21.7053 43.2339 21.36C43.3459 21.0053 43.4019 20.6133 43.4019 20.184V20.016C43.4019 19.596 43.3459 19.2133 43.2339 18.868C43.1219 18.5133 42.9633 18.21 42.7579 17.958C42.5619 17.706 42.3239 17.5147 42.0439 17.384C41.7733 17.244 41.4839 17.174 41.1759 17.174H41.0219C40.7139 17.174 40.4246 17.244 40.1539 17.384C39.8833 17.5147 39.6453 17.706 39.4399 17.958C39.2439 18.21 39.0853 18.5133 38.9639 18.868C38.8426 19.2133 38.7819 19.596 38.7819 20.016Z"/><rect class="mc" x="56" width="40" height="40" rx="20"/><rect class="ml ml1" x="68" y="16" width="16" height="2" rx="1"/><rect class="ml ml2" x="68" y="22" width="16" height="2" rx="1"/></svg>`;

function menuHTML(){
  let i=0;
  const col=(title,items)=>{const h=i++;return `<div class="nav-col"><h3 data-i style="--i:${h}">${esc(title)}</h3><ul>${items.map((l,k)=>`<li data-i style="--i:${h+k+1}">${link(l)}</li>`).join("")}</ul></div>`};
  return `<div class="nav-dim" id="navDim" aria-hidden="true"></div>
<div class="nav" id="nav" tabindex="-1" role="dialog" aria-modal="true" aria-label="Меню сайту" inert>
  <div class="nav-in">
    <div class="nav-info">
      <p class="nav-title" data-i style="--i:0">${esc(SITE.menuTitle)}</p>
      <div class="nav-time" data-i style="--i:1"><p>${sched}</p>${link(SITE.more)}</div>
      ${social(' data-i style="--i:2"')}
    </div>
    <nav class="nav-cols" aria-label="Головне меню">${col("Меню",SITE.menu)}${col("Корисне",SITE.useful)}</nav>
  </div>
</div>
<header class="bar">
  <a class="brand" href="${esc(BASE)}" data-magnet aria-label="Філадельфія — на головну"><img class="on-dark" src="${asset("logo.svg")}" alt="Філадельфія" width="210" height="42"><img class="on-light" src="${asset("logo-dark.svg")}" alt="" width="210" height="42"></a>
  <button class="menu" id="menuBtn" type="button" aria-label="Відкрити меню" aria-expanded="false" aria-controls="nav" data-magnet data-hover="#000" data-shape=".mc">${SVG}</button>
</header>`;
}

function nextHTML(){
  const N=SITE.next;
  return `<section class="nx" id="next" aria-labelledby="nx-h">
  <div class="nx-head"><h2 id="nx-h">${esc(N.title)}</h2><p>${esc(N.text)}</p></div>
  <div class="nx-row">${N.cards.map(c=>`
    <article class="nx-card">
      <div class="nx-text"><small>${esc(c.label)}</small><h3>${c.title}</h3><p>${esc(c.text)}</p></div>
      <a class="lbtn" href="${esc(c.href)}">${esc(c.button)}</a>
    </article>`).join("")}
  </div>
</section>`;
}

function footerHTML(){
  const col=(t,items)=>`<div class="ft-col"><h3>${esc(t)}</h3><ul>${items.map(l=>`<li>${link(l)}</li>`).join("")}</ul></div>`;
  return `<footer class="ft" id="footer">
  <div class="ft-in">
    <div class="ft-top">
      <div class="ft-about">
        <div class="ft-logo"><img class="m" src="${asset("b9/mark.svg")}" alt="" width="57" height="57"><span><img class="w" src="${asset("b9/word.svg")}" alt="Філадельфія" width="162" height="19"><small>Християнська Церква</small></span></div>
        <div class="ft-contact">
          <a class="ft-mail" href="mailto:${esc(SITE.email)}"><span class="u">${esc(SITE.email)}</span></a>
          <address class="ft-addr">${SITE.address.map(esc).join("<br>")}</address>
          <p class="ft-time">${sched}</p>
        </div>
        ${social()}
      </div>
      <nav class="ft-nav" aria-label="Меню в підвалі">${col("Меню",SITE.menu)}${col("Корисне",SITE.useful)}</nav>
    </div>
    <div class="ft-bot"><span>${esc(SITE.copyright)}</span>${link(SITE.privacy)}</div>
  </div>
</footer>`;
}

const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
// посилання на секцію цієї ж сторінки (#id або сторінка.html#id, коли ми вже на ній) — плавно прокручуємо замість переходу
const norm=p=>p.replace(/index\.html$/,"");
const sameTarget=a=>{try{const u=new URL(a.href,location.href);if(!u.hash||u.hash.length<2)return null;
  if(u.origin!==location.origin||norm(u.pathname)!==norm(location.pathname))return null;return document.getElementById(decodeURIComponent(u.hash.slice(1)))}catch(e){return null}};
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest(".ft a,.nx a");if(!a)return;const t=sameTarget(a);if(t){e.preventDefault();t.scrollIntoView({behavior:reduce?"auto":"smooth"})}});
function wireMenu(root){
  const q=s=>root.querySelector(s);
  const btn=q("#menuBtn"),nav=q("#nav"),dim=q("#navDim"),bar=q(".bar");
  let open=false;
  const set=o=>{
    if(o===open)return;open=o;
    nav.classList.toggle("open",o);dim.classList.toggle("open",o);bar.classList.toggle("nav-open",o);
    nav.inert=!o;btn.setAttribute("aria-expanded",String(o));btn.setAttribute("aria-label",o?"Закрити меню":"Відкрити меню");
    if(o)setTimeout(()=>nav.focus({preventScroll:true}),450);else btn.focus({preventScroll:true});
  };
  window.navOpen=()=>open;
  btn.addEventListener("click",()=>set(!open));
  dim.addEventListener("click",()=>set(false));
  // сторінка під відкритим меню стоїть на місці, без зміни її розкладки
  const hold=e=>{if(open&&!nav.contains(e.target))e.preventDefault()};
  addEventListener("wheel",hold,{passive:false});addEventListener("touchmove",hold,{passive:false});
  addEventListener("keydown",e=>{if(e.key==="Escape"&&open)set(false)});
  // клік на пункт закриває меню, потім сторінка їде до потрібної секції
  nav.addEventListener("click",e=>{const a=e.target.closest("a");if(!a)return;
    set(false);
    const t=sameTarget(a);if(t){e.preventDefault();setTimeout(()=>t.scrollIntoView({behavior:reduce?"auto":"smooth"}),300)}
  });
  // шапка ховається, коли гортають вниз, і повертається, щойно починають гортати вгору
  let lastY=scrollY,run=0;
  const autoHide=()=>{
    const y=Math.max(0,scrollY),dy=y-lastY;lastY=y;
    if(open||y<120){run=0;bar.classList.remove("away");return}      // біля верху сторінки і з відкритим меню — завжди видно
    run=(dy>0)===(run>0)?run+dy:dy;                                     // скільки пікселів поспіль в один бік
    if(run>16)bar.classList.add("away");else if(run<-6)bar.classList.remove("away");
  };
  addEventListener("scroll",autoHide,{passive:true});
  bar.addEventListener("focusin",()=>bar.classList.remove("away"));   // Tab на лого чи кнопку меню показує шапку
  // автоматичний колір шапки: <site-menu tone="auto"> + data-dark на темних секціях сторінки
  if(root.getAttribute("tone")==="auto"){
    // світлі картки всередині темних блоків (картки «А що мені далі робити?», [data-light]) знову роблять шапку темною
    const under=el=>{const r=el.getBoundingClientRect();return r.top<70&&r.bottom>40};
    const tick=()=>{const dark=[...document.querySelectorAll("[data-dark]")].some(under)&&![...document.querySelectorAll("[data-light],.nx-card")].some(under);bar.classList.toggle("light",!dark)};
    addEventListener("scroll",tick,{passive:true});addEventListener("resize",tick);
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tick);else tick();
  }
}

customElements.define("site-menu",class extends HTMLElement{
  connectedCallback(){if(this.dataset.ready)return;this.dataset.ready="1";this.innerHTML=menuHTML();wireMenu(this)}
});
/* виїзд футера: <main> перед футером має лежати НАД ним і мати непрозорий фон (див. пояснення в шапці файлу) */
function revealFix(ft){
  let n=ft;while(n&&n!==document.body&&!n.previousElementSibling)n=n.parentElement;
  let prev=n&&n.previousElementSibling;
  while(prev&&/^(SCRIPT|STYLE|LINK|DIALOG|TEMPLATE|SITE-MENU)$/.test(prev.tagName))prev=prev.previousElementSibling;
  if(prev&&prev.tagName==="DIV"){const m=prev.querySelector(":scope > main");if(m)prev=m}
  if(!prev||prev.tagName!=="MAIN")return;
  let wrapZ=0;for(let a=ft.parentElement;a&&a!==document.body;a=a.parentElement){const z=parseInt(getComputedStyle(a).zIndex);if(!isNaN(z)&&getComputedStyle(a).position!=="static"){wrapZ=z;break}}
  const cs=getComputedStyle(prev),z=parseInt(cs.zIndex)||0;
  if(cs.position==="static")prev.style.position="relative";
  if(z<=wrapZ)prev.style.zIndex=String(wrapZ+1);
  if(/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)){
    const bg=getComputedStyle(document.body).backgroundColor;
    prev.style.background=/rgba\(0, 0, 0, 0\)|transparent/.test(bg)?"#F7F2E8":bg;
  }
}
customElements.define("site-next",class extends HTMLElement{
  connectedCallback(){if(this.dataset.ready)return;this.dataset.ready="1";this.innerHTML=nextHTML()}
});
customElements.define("site-footer",class extends HTMLElement{
  connectedCallback(){if(this.dataset.ready)return;this.dataset.ready="1";this.innerHTML=footerHTML();
    const ft=this.querySelector(".ft");
    const fit=()=>{ft.classList.remove("tall");ft.classList.toggle("tall",ft.scrollHeight>innerHeight+1)};
    const rf=()=>revealFix(this);rf();addEventListener("load",rf);
    fit();addEventListener("resize",fit);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit)}
});
// будь-яке текстове посилання на сторінці отримує той самий стиль підкреслення
const plain=a=>!a.className&&!a.hasAttribute("data-no-u")&&!a.querySelector(".u")&&a.children.length===0&&a.textContent.trim();
const wrap=root=>{(root.querySelectorAll?root:document).querySelectorAll("a").forEach(a=>{if(!plain(a))return;const u=document.createElement("span");u.className="u";u.append(...a.childNodes);a.append(u)})};
const start=()=>{wrap(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.tagName==="A")wrap(n.parentNode||document);else wrap(n)}))).observe(document.body,{childList:true,subtree:true})};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
window.PHILAD_SITE=SITE;
})();

/* інструменти розробки (тюнери, перемикачі варіантів) видно лише локально; на бойовому домені вони приховані */
if(!/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/.test(location.hostname)){const st=document.createElement("style");st.textContent=".tuner-tab,.tuner,.tt-tab,.tt,.vsw{display:none!important}";document.head.appendChild(st)}
