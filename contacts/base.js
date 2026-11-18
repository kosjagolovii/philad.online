/* «Контакти» — спільні помічники трьох варіантів: дані з site.js, форма заявки, поява при скролі, перемикач варіантів */
(function(){
"use strict";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const S=window.SITE_DATA;
const days=S.schedule.map(t=>{const i=t.lastIndexOf(" ");return{day:t.slice(0,i),time:t.slice(i+1)}});
const MAIL=S.email;
function formHTML(opts){
  opts=opts||{};
  return `<form class="cf${opts.dark?" on-dark":""}${opts.compact?" compact":""}" novalidate data-subject="${opts.subject||""}" aria-label="${opts.label||"Залишити заявку"}">
    <div class="fields" style="display:grid;gap:14px">
      ${opts.compact?'<div class="row2">':""}
      <label>Ваше ім’я<input name="name" type="text" autocomplete="name" placeholder="Ім’я" required></label>
      <label>Телефон або e-mail<input name="contact" type="text" autocomplete="email" placeholder="+380… або пошта" required></label>
      ${opts.compact?"</div>":""}
      <label>${opts.messageLabel||"Повідомлення"}<textarea name="message" placeholder="${opts.placeholder||"Чим ми можемо допомогти?"}"></textarea></label>
      <label class="hp" aria-hidden="true">Не заповнюйте<input name="website" tabindex="-1" autocomplete="off"></label>
      <button type="submit">${opts.button||"Залишити заявку"}</button>
      <p class="note">Ми зв’яжемось з вами найближчим часом. Ваші дані потрібні лише для відповіді.</p>
    </div>
    <p class="status" role="status" aria-live="polite"></p>
    <div class="thanks"><b>${opts.thanks||"Дякуємо! Заявку отримано"}</b><span>Ми зв’яжемось з вами найближчим часом.</span></div>
  </form>`;
}
function bindForms(){
  document.querySelectorAll("form.cf").forEach(f=>{
    const st=f.querySelector(".status"),btn=f.querySelector("button[type=submit]");
    const say=(t,err)=>{st.textContent=t;st.classList.toggle("err",!!err)};
    f.addEventListener("submit",async e=>{
      e.preventDefault();
      const d=Object.fromEntries(new FormData(f));
      if(d.website)return;                                   // пастка для ботів
      const bad=[];
      ["name","contact"].forEach(k=>{const el=f.elements[k];const ok=String(d[k]||"").trim().length>=2;el.setAttribute("aria-invalid",!ok);if(!ok)bad.push(el)});
      if(bad.length){say("Заповніть ім’я та телефон або e-mail.",true);bad[0].focus();return}
      const payload={name:d.name.trim(),contact:d.contact.trim(),message:(d.message||"").trim(),page:location.href};
      btn.disabled=true;say("Надсилаємо…");
      if(S.formEndpoint){
        try{
          const r=await fetch(S.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
          if(!r.ok)throw 0;
          f.classList.add("done");say("");
        }catch(_){say("Не вдалося надіслати. Спробуйте ще раз або напишіть на "+MAIL+".",true)}
      }else if(S.formEmail){
        try{
          await S.send(f.dataset.subject||"Заявка з сайту philad.org",{"Ім’я":payload.name,"Телефон або e-mail":payload.contact,"Повідомлення":payload.message||"—","Сторінка":payload.page});
          f.classList.add("done");say("");
        }catch(_){say("Не вдалося надіслати. Спробуйте ще раз або напишіть на "+S.formEmail+".",true)}
      }else{
        // немає ні сервера, ні адреси — відкриваємо поштову програму з готовим листом
        const body=`Ім’я: ${payload.name}\nТелефон або e-mail: ${payload.contact}\n\n${payload.message}`;
        location.href=`mailto:${MAIL}?subject=${encodeURIComponent(f.dataset.subject||"Заявка з сайту philad.org")}&body=${encodeURIComponent(body)}`;
        say("Відкрили вашу поштову програму — натисніть «Надіслати» у листі.");
      }
      btn.disabled=false;
    });
    f.addEventListener("input",e=>{if(e.target.getAttribute&&e.target.getAttribute("aria-invalid")==="true")e.target.setAttribute("aria-invalid","false")});
  });
}
window.CT={
  esc,S,days,MAIL,formHTML,
  addr:S.address.join(", "),
  init(opts){
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ft=document.getElementById("footer"); if(ft) ft.setAttribute("data-dark","");
    bindForms();
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -10% 0px"});
    document.querySelectorAll(".rv").forEach(el=>reduce?el.classList.add("in"):io.observe(el));
    document.querySelectorAll("[data-goto]").forEach(a=>a.addEventListener("click",e=>{const t=document.querySelector(a.dataset.goto);if(!t)return;e.preventDefault();t.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"})}));
    if(opts&&opts.switcher===false)return;
    const V=[["Основна","/contacts/"]];
    const here=location.pathname.split("/").pop()||"/contacts/";
    const nav=document.createElement("nav");
    nav.className="vsw";nav.setAttribute("aria-label","Варіанти сторінки");
    nav.innerHTML="<span>Варіант</span>"+V.map(([l,h])=>`<a href="${h}" data-no-u${h===here?' aria-current="page"':""}>${l}</a>`).join("");
    document.body.appendChild(nav);
  }
};
})();
