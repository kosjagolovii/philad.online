/* ЄДИНЕ вікно з формою заявки («Напишіть нам» / «Хочу служити»): пісочна картка з полями без підписів, кнопка «Відправити».
   Підключення: <script src="components/join-form.js"></script>, відкриття: JoinForm.open({title, text, ministry, ministryName, subject}).
   Надсилання — як у ministry.html: локально /__save/application, на сайті SITE_DATA.send (пошта), інакше лист у поштовій програмі.
   Текст — токени UI-кіта (ui-kit/tokens.css). */
(()=>{
const CSS=`
.jf{width:min(560px,calc(100vw - 24px));max-height:calc(100svh - 24px);padding:0;border:0;border-radius:24px;background:#E9E2D3;color:var(--ink,#141414);overflow:auto;box-sizing:border-box;overscroll-behavior:contain}
.jf::backdrop{background:rgba(20,20,20,.55);backdrop-filter:blur(4px)}
.jf[open]{animation:jfIn .4s cubic-bezier(.2,.7,.2,1)}
@keyframes jfIn{from{opacity:0;transform:translateY(18px) scale(.98)}}
.jf-in{padding:40px 32px 32px}
.jf h2,.jf-inline h2{margin:0;text-align:center;font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font,inherit);letter-spacing:var(--h3-track);text-wrap:balance}
.jf-p,.jf-inline .jf-p{margin:12px 0 24px;text-align:center;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font,inherit);letter-spacing:var(--t2-track);opacity:.65;text-wrap:balance}
.jf form,.jf-inline form{display:grid;gap:16px}
.jf input,.jf textarea,.jf-inline input,.jf-inline textarea{width:100%;box-sizing:border-box;padding:17px 20px;border:2px solid transparent;border-radius:14px;background:#fff;color:#1a1c19;font:var(--t1-weight) var(--t1-size)/var(--t1-lh) var(--font,inherit);letter-spacing:var(--t1-track);transition:border-color .2s}
.jf textarea,.jf-inline textarea{min-height:94px;height:94px;resize:vertical}
.jf input::placeholder,.jf textarea::placeholder,.jf-inline input::placeholder,.jf-inline textarea::placeholder{color:rgba(0,0,0,.3)}
.jf input:focus,.jf textarea:focus,.jf-inline input:focus,.jf-inline textarea:focus{outline:none;border-color:#1a1c19}
.jf .bad,.jf-inline .bad{border-color:#C0392B}
.jf-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.jf-err{margin:0;text-align:center;color:#B3261E;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font,inherit)}
.jf-err:empty{display:none}
.jf button[type=submit],.jf-inline button[type=submit]{height:56px;border:0;border-radius:14px;background:var(--teal,#317C8E);color:#fff;cursor:pointer;font:var(--t3-weight) var(--t3-size)/var(--t3-lh) var(--font,inherit);letter-spacing:var(--t3-track);text-transform:uppercase;transition:background .2s}
.jf button[type=submit]:hover:not(:disabled),.jf-inline button[type=submit]:hover:not(:disabled){background:var(--teal-ink,#28697A)}
.jf button[type=submit]:disabled,.jf-inline button[type=submit]:disabled{opacity:.6;cursor:default}
.jf-note{margin:0;text-align:center;font:var(--t2-weight) var(--t2-size)/var(--t2-lh) var(--font,inherit);opacity:.5}
.jf-ok{display:none;gap:10px;justify-items:center;text-align:center;padding:36px 12px 20px}
.jf-ok b{font:var(--h3-weight) var(--h3-size)/var(--h3-lh) var(--font,inherit);letter-spacing:var(--h3-track)}
.jf-ok span{font:var(--t1-weight) var(--t1-size)/var(--t1-lh) var(--font,inherit);opacity:.7}
.jf.sent form,.jf.sent .jf-p{display:none}.jf.sent .jf-ok{display:grid}
.jf-x{position:absolute;top:12px;right:12px;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(20,20,20,.08);color:inherit;cursor:pointer;font-size:0;transition:background .2s}
.jf-x::before,.jf-x::after{content:"";position:absolute;left:50%;top:50%;width:16px;height:2px;margin:-1px 0 0 -8px;border-radius:1px;background:currentColor}   /* хрестик малюємо лініями — рівно по центру кола */
.jf-x::before{rotate:45deg}.jf-x::after{rotate:-45deg}
.jf-x:hover{background:rgba(20,20,20,.16)}
.jf-x:focus-visible,.jf input:focus-visible{outline:2px solid var(--teal,#317C8E);outline-offset:2px}
.jf-inline{box-sizing:border-box;width:min(640px,100%);margin-inline:auto;padding:40px 32px 32px;border-radius:24px;background:#E9E2D3;color:var(--ink,#141414);scroll-margin-top:100px}
.jf-inline.sent form,.jf-inline.sent .jf-p{display:none}.jf-inline.sent .jf-ok{display:grid}
html.jf-lock{overflow:hidden}
@media (max-width:560px){.jf{border-radius:20px}.jf-in{padding:36px 18px 22px}}
@media (prefers-reduced-motion:reduce){.jf[open]{animation:none}}`;
let dlg,cfg={};
const okContact=s=>{const t=s.trim();return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)||t.replace(/\D/g,"").length>=9&&/^[+\d\s()\-.]+$/.test(t)};
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
async function deliver(p){
  if(LOCAL){
    const r=await fetch("/__save/application",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ministry:p.ministry,ministryName:p.ministryName,name:p.name,contact:p.contact,comment:p.comment,ts:p.ts})});
    const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||("HTTP "+r.status));return;
  }
  const S=window.SITE_DATA;
  if(S&&S.formEmail){await S.send(p.subject,{"Звідки":p.ministryName||"—","Ім’я":p.name,"Телефон або e-mail":p.contact,"Коментар":p.comment||"—","Сторінка":location.href});return}
  const body=`Ім’я: ${p.name}\nТелефон або e-mail: ${p.contact}\n\n${p.comment}`;
  location.href=`mailto:${(S&&S.email)||"info@philad.org"}?subject=${encodeURIComponent(p.subject)}&body=${encodeURIComponent(body)}`;
}
const INNER=`<h2 class="jf-t"></h2><p class="jf-p"></p>
    <form novalidate>
      <input name="name" type="text" autocomplete="name" placeholder="Ваше ім’я" aria-label="Ваше ім’я" maxlength="80" required>
      <input name="contact" type="text" inputmode="email" autocomplete="tel" placeholder="Номер телефону або пошта" aria-label="Номер телефону або пошта" maxlength="120" required>
      <textarea name="msg" placeholder="Коментар (за бажанням)" aria-label="Коментар" maxlength="800"></textarea>
      <input class="jf-hp" type="text" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="jf-err" role="alert"></p>
      <button type="submit">Відправити</button>
      <p class="jf-note">Ми зв’яжемось з вами найближчим часом</p>
    </form>
    <div class="jf-ok" role="status"><b>Дякуємо!</b><span>Повідомлення отримано. Ми зв’яжемось з вами найближчим часом.</span></div>`;
let cssOn=false;
const addCSS=()=>{if(cssOn)return;cssOn=true;const st=document.createElement("style");st.textContent=CSS;document.head.append(st)};
const defaults=o=>Object.assign({title:"Хочете доєднатись до служіння?",text:"Або можливо у вас є пропозиції чи побажання. Заповніть форму і ми з вами зв’яжемося"},o||{});
/* підключає поля, перевірку й надсилання до блоку root; cfgOf() повертає поточні налаштування */
function wire(root,cfgOf){
  const f=root.querySelector("form"),err=root.querySelector(".jf-err"),btn=f.querySelector("button");
  f.addEventListener("input",e=>e.target.classList&&e.target.classList.remove("bad"));
  f.addEventListener("submit",async e=>{
    e.preventDefault();
    const c=cfgOf(),name=f.name.value.trim(),contact=f.contact.value.trim(),msg=f.msg.value.trim();
    err.textContent="";if(f.site.value)return;                                         // пастка для ботів
    if(!name){f.name.classList.add("bad");err.textContent="Напишіть, як до вас звертатись.";f.name.focus();return}
    if(!okContact(contact)){f.contact.classList.add("bad");err.textContent="Вкажіть номер телефону (з кодом) або пошту, щоб ми могли з вами зв’язатись.";f.contact.focus();return}
    btn.disabled=true;btn.textContent="Надсилаємо…";
    try{
      await deliver({ministry:c.ministry||"general",ministryName:c.ministryName||"",subject:c.subject||"Заявка з сайту philad.org",name,contact,comment:msg,ts:new Date().toISOString()});
      root.classList.add("sent");
    }catch(x){err.textContent="Не вдалося надіслати: "+x.message+". Напишіть нам на пошту info@philad.org."}
    finally{btn.disabled=false;btn.textContent="Відправити"}
  });
}
const fill=(root,c)=>{root.querySelector(".jf-t").textContent=c.title;root.querySelector(".jf-p").textContent=c.text};
function build(){
  addCSS();
  dlg=document.createElement("dialog");dlg.className="jf";dlg.setAttribute("aria-labelledby","jfT");
  dlg.innerHTML=`<div class="jf-in">${INNER}</div><button class="jf-x" type="button" aria-label="Закрити"></button>`;
  dlg.querySelector(".jf-t").id="jfT";
  document.body.append(dlg);
  dlg.querySelector(".jf-x").onclick=()=>dlg.close();
  dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
  dlg.addEventListener("close",()=>{document.documentElement.classList.remove("jf-lock");if(dlg._from)dlg._from.focus({preventScroll:true})});
  wire(dlg,()=>cfg);
}
window.JoinForm={
  /* та сама форма, але вбудована в сторінку (блок у кінці сторінки служіння): JoinForm.inline(елемент, {ministry, ministryName, subject, title, text}) */
  inline(host,o){
    addCSS();const c=defaults(o);host.classList.add("jf-inline");host.innerHTML=INNER;fill(host,c);wire(host,()=>c);return host},
  open(o,from){
    cfg=defaults(o);
    if(!dlg)build();
    dlg.classList.remove("sent");dlg.querySelector("form").reset();dlg.querySelector(".jf-err").textContent="";
    dlg.querySelectorAll(".bad").forEach(x=>x.classList.remove("bad"));
    fill(dlg,cfg);
    dlg._from=from||null;document.documentElement.classList.add("jf-lock");dlg.showModal();
    setTimeout(()=>dlg.querySelector('[name=name]').focus({preventScroll:true}),60);
  }
};
})();
