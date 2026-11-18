/* Блог + Архів подій = ОДНА база записів сторінки блогу.
   Підключається ПІСЛЯ blog/data.js (його дані зберігає вставка в сторінці) і library/events.js; результат — звичайний window.PHILAD_BLOG, який читає blog/lib.js.
   Події отримують вкладки ev, ev-2019…; їхні теми зливаються з темами блогу (однакові за змістом — в одну), інші додаються. */
(()=>{
const B=window.__BLOG_DATA,E=window.PHILAD_BLOG;
const SAME={war:"war",holiday:"holiday",family:"family"};          // тема подій → та сама тема блогу (дві назви одного змісту)
const th=t=>SAME[t]||"e-"+t;
/* вкладки блогу пересічні: «Відеоблоги» (75) повністю входять до «Інтерв’ю та відеоблоги» (79), 4 різниці — текстові інтерв’ю (3 з них уже в «Статтях»).
   Тому «iv» прибираємо: відео → vlog, текстове інтерв’ю → stati. */
const fix=p=>{const t=new Set(p.tabs.filter(x=>x!=="iv"));if(p.kind==="interview")t.add("stati");t.add("blog");return[...t]};
const posts=[
  ...B.posts.map(p=>({...p,src:"blog",year:p.date.slice(0,4),tabs:fix(p)})),
  ...E.posts.map(p=>({...p,src:"ev",kind:"event",year:p.date.slice(0,4),tabs:["ev"],themes:[...new Set(p.themes.map(th))]}))
].sort((a,b)=>b.date.localeCompare(a.date));
const themes={...B.THEMES,holiday:"Свята й ярмарки",war:"Війна і служіння, Україна"};
Object.entries(E.THEMES).forEach(([k,v])=>{if(!SAME[k])themes["e-"+k]=v});
const blogTabs=B.TABS.filter(t=>t[0]!=="all");
const TABS=[["all","Усе"],["stati","Статті"],["svid","Свідоцтва"],["vlog","Відеоблоги"],["ev","Події"]];
window.PHILAD_BLOG={TABS,KINDS:{...B.KINDS,event:"Подія"},THEMES:themes,posts};
})();
