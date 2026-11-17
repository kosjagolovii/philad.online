/* =====================================================================
   Домашні групи · ЄДИНА база груп для всього сайту.
   Її читає блок <home-groups> (components/groups.js) на кожній сторінці, де він стоїть:
   homegroups.html, youth.html … Змінюєте тут — змінюється всюди.
   ---------------------------------------------------------------------
   Одна група = один рядок. Поля:
     img    — назва фото в папці groups/ (беруться два файли: <img>-a.webp аватар, <img>-w.webp широке)
     leader — ім'я лідера (або назва групи, якщо title не заданий)
     title  — назва для особливих груп (замість імені лідера)
     area   — район;  place — адреса так, як її бачить відвідувач
     at     — координати [довгота, широта]; null — група онлайн або без точки
     days   — дні: mon tue wed thu fri sat sun; "flex" — плаваючий графік
     when   — як писати час у картці;  time — короткий час для списку
     age    — вік учасників [від, до] (null — не вказано);  ageText — як писати
     size   — кількість учасників (необов'язково);  note — примітка (необов'язково)
     url    — сторінка групи на philad.org (там форма «Записатись у групу»)
     youth:true — молодіжна група (фільтр «16–25 років» і блок «Молодіжні домашки» на youth.html)
     archived:true — група в архіві: не показується в списку й на карті (повернути — прибрати це поле або тюнер → Архів → Повернути)
   Дані взято з philad.org/domashnie-gruppy (листопад 2026).
   ===================================================================== */
window.PHILAD_GROUPS=(()=>{
const CH=[30.51349,50.39785];              // вул. Голосіївська, 57 — церква і соццентр
const U="https://philad.org/groups/";
return [
 {img:"shashlov",youth:true,leader:"Андрій Шашлов",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["tue"],when:"Щовівторка, 19:00–21:00",time:"19:00",age:[22,27],ageText:"22–27 років",url:U+"domashnya-grupa-andrija-shashlova/"},
 {img:"brovchenko",leader:"Павло Бровченко",area:"Дарницький",place:"вул. Драгоманова",at:[30.63835,50.41021],days:["thu"],when:"Щочетверга, 19:00–21:00",time:"19:00",age:[30,45],ageText:"30–45 років",url:U+"domashnya-grupa-brovchenko-pavla/"},
 {img:"izgarshev",leader:"Володимир Ізгаршев",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["fri"],when:"Щоп’ятниці, 19:00",time:"19:00",age:[25,35],ageText:"25–35 років",url:U+"domashnya-grupa-izgarsheva-volodimira/"},
 {img:"shevchenko",leader:"Костянтин Шевченко",area:"Голосіївський",place:"Онлайн",at:null,online:true,days:["tue"],when:"Щовівторка, 19:30",time:"19:30",age:[30,70],ageText:"30–70 років",url:U+"domashnya-grupa-kostjantyn-shevchenko/"},
 {img:"polegenko",youth:true,leader:"Костянтин Полегенько",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["fri"],when:"Щоп’ятниці, 19:00–21:00",time:"19:00",age:[17,22],ageText:"17–22 роки",url:U+"domashnya-grupa-kostyantina-polegenko/"},
 {img:"kotylko",leader:"Ярослав Котилко",area:"Теремки",place:"просп. Академіка Глушкова, 33",at:[30.45537,50.36628],days:["tue"],when:"Щовівторка, 19:00–21:00",time:"19:00",age:[35,99],ageText:"35+ років",url:U+"domashnya-grupa-kotilko-yaroslava/"},
 {img:"leshchuk",youth:true,leader:"Андрій Лещук",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["fri"],when:"Щоп’ятниці, 19:00–21:00",time:"19:00",age:[18,22],ageText:"18–22 роки",url:U+"domashnya-grupa-leshchuka-andriia/"},
 {img:"tarasova",leader:"Лілія Тарасова",area:"Ходосіївка",place:"с. Ходосіївка",at:[30.52208,50.27275],days:["flex"],when:"Плаваючий графік",time:"за домовленістю",age:[40,60],ageText:"40–60 років",url:U+"domashnya-grupa-lilii-tarasovoi/"},
 {img:"lisovskyi",youth:true,leader:"Дмитро Лісовський",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["tue"],when:"Щовівторка, 19:00–21:00",time:"19:00",age:[22,27],ageText:"22–27 років",url:U+"domashnya-grupa-lisovskogo-dmytra/"},
 {img:"perevalova",leader:"Наталя Перевалова",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["sun"],when:"Щонеділі, 12:30",time:"12:30",age:[40,60],ageText:"40–60 років",url:U+"domashnya-grupa-natali-perevalova/"},
 {img:"zhuchenko",leader:"Олег Жученко",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["flex"],when:"Плаваючий графік",time:"за домовленістю",age:[40,60],ageText:"40–60 років",url:U+"domashnya-grupa-olega-zhuchenko-2/"},
 {img:"zhuchenko",leader:"Олег Жученко",area:"Деснянський",place:"Харківське шосе",at:[30.64659,50.42377],days:["flex"],when:"Плаваючий графік",time:"за домовленістю",age:[45,60],ageText:"45–60 років",url:U+"domashnya-grupa-olega-zhuchenko/"},
 {img:"kozlovskyi",leader:"Олександр Козловський",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["sun"],when:"Щонеділі, 14:30",time:"14:30",age:null,url:U+"domashnya-grupa-oleksandr-kozlovskiy/"},
 {img:"volvachev",leader:"Олексій Вольвачев",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["tue"],when:"Щовівторка, 18:00",time:"18:00",age:[30,45],ageText:"30–45 років",url:U+"domashnya-grupa-oleksiya-volvacheva/"},
 {img:"balaban",leader:"Олена Балабан",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["thu"],when:"Щочетверга, 17:00",time:"17:00",age:[45,50],ageText:"45–50 років",url:U+"domashnya-grupa-oleni-balaban/"},
 {img:"kazmirchuk",leader:"Олена Казмирчук",area:"Голосіївський",place:"вул. Голосіївська, 57, соццентр",at:CH,days:["mon"],when:"Щопонеділка, 12:00",time:"12:00",age:null,url:U+"domashnya-grupa-oleni-kazmirchuk/"},
 {img:"effi",youth:true,leader:"Принц Ефе",area:"Голосіївський",place:"вул. Голосіївська, 57б",at:CH,days:["tue"],when:"Щовівторка, 19:00–21:00",time:"19:00",age:[25,31],ageText:"25–31 рік",url:U+"domashnya-grupa-princa-effi/"},
 {img:"marenych-s",leader:"Сергій Маренич",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["fri"],when:"Щоп’ятниці, 19:00",time:"19:00",age:[25,35],ageText:"25–35 років",url:U+"domashnya-grupa-sergiya-marenicha/"},
 {img:"sinchuk",leader:"Сергій Сінчук",area:"Голосіївський",place:"Онлайн",at:null,online:true,days:["tue"],when:"Щовівторка, 19:00",time:"19:00",age:[40,80],ageText:"40–80 років",url:U+"domashnya-grupa-sergiya-sinchuka/"},
 {img:"marenych-sv",leader:"Світлана Маренич",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["sun"],when:"Щонеділі, 9:00",time:"9:00",age:[50,60],ageText:"50–60 років",url:U+"domashnya-grupa-svitlany-marenych/"},
 {img:"rogalevych",leader:"Тетяна Рогалевич",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["sun"],when:"Щонеділі, 12:00",time:"12:00",age:[30,70],ageText:"30–70 років",url:U+"domashnya-grupa-tetyani-rogalevich-u-nedi/"},
 {img:"rogalevych",leader:"Тетяна Рогалевич",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["tue"],when:"Щовівторка, 10:00",time:"10:00",age:[30,70],ageText:"30–70 років",url:U+"domashnya-grupa-tetyani-rogalevich/"},
 {img:"pavlenko",leader:"Вадим Павленко",area:"Голосіївський",place:"вул. Голосіївська, 57б",at:CH,days:["sat"],when:"Щосуботи, 10:00–12:00",time:"10:00",age:[30,45],ageText:"30–45 років",url:U+"domashnya-grupa-vadyma-pavlenko/"},
 {img:"gordiichuk-v",leader:"Вікторія Гордійчук",area:"Голосіївський",place:"Онлайн",at:null,online:true,days:["thu"],when:"Щочетверга, 19:00",time:"19:00",size:"8–10 людей",age:[40,60],ageText:"40–60 років",url:U+"domashnya-grupa-viktorii-gordijchuk/"},
 {img:"iegorov",archived:true,leader:"Володимир Єгоров",area:"Святошинський",place:"просп. Леся Курбаса, 9ж",at:[30.38275,50.42887],days:["mon"],when:"Щопонеділка, 19:00",time:"19:00",size:"10 людей",age:[35,45],ageText:"близько 40 років",url:U+"domashnya-grupa-volodimira-iegorova/"},
 {img:"khochai",leader:"Володимир Хочай",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["tue"],when:"Щовівторка, 18:30",time:"18:30",age:[30,45],ageText:"30–45 років",url:U+"domashnya-grupa-volodimira-khochaya/"},
 {img:"pavlov",leader:"Володимир Павлов",area:"Голосіївський",place:"вул. Голосіївська, 57, церква",at:CH,days:["tue"],when:"Щовівторка, 19:00",time:"19:00",age:[30,50],ageText:"30–50 років",url:U+"domashnya-grupa-volodimira-pavlova/"},
 {img:"kavun",leader:"Юрій Кавун",area:"Голосіївський",place:"просп. Науки",at:[30.52998,50.39134],days:["thu","fri"],when:"Четвер або п’ятниця, 19:00",time:"19:00",age:[28,45],ageText:"28–45 років",url:U+"domashnya-grupa-yuriya-kavuna/"},
 {img:null,leader:"Жанна Череднеченко",area:"Голосіївський",place:"Онлайн",at:null,online:true,days:["tue"],when:"Щовівторка, 19:00",time:"19:00",age:[50,70],ageText:"50–70 років",url:U+"domashnya-grupa-zhanna-cherednechenko/"},
 {img:"kovalevska",leader:"Олена Ковалевська",area:"Голосіївський",place:"7 хв від метро «Теремки»",at:[30.45254,50.37217],days:["tue"],when:"Щовівторка, 11:00",time:"11:00",age:[50,60],ageText:"50–60 років",url:U+"domashnya-grupaoleni-andriivni-kovale/"},
 {img:"kozmenko",leader:"Сергій Козьменко",area:"Бровари",place:"м. Бровари, вул. Дорошенка",at:[30.76043,50.49257],days:["wed"],when:"Щосереди, 19:00",time:"19:00",age:null,url:U+"domashnya-grupasergiya-kozmenka/"},
 {img:"mamy",title:"Група для мам і дружин військових",leader:"Тетяна Василенко",area:"Голосіївський",place:"вул. Голосіївська, 57",at:CH,days:["sat"],when:"Щосуботи, 12:00–14:00",time:"12:00",age:null,ageText:"Мами й дружини чинних військових і ветеранів",special:true,note:"Для родин загиблих і зниклих безвісти — групи в процесі набору",url:U+"grupa-pidtrimki-dlya-mam-i-druzhin-chinni/"},
 {img:"gordiichuk-vs",leader:"Василь Гордійчук",area:"Оболонський",place:"просп. Оболонський, 37",at:[30.49758,50.51893],days:["thu"],when:"Щочетверга, 19:00",time:"19:00",age:[40,70],ageText:"40–70 років",url:U+"sedmaya-gruppa/"},
 {img:"melnyk",youth:true,leader:"Мельник",area:"Голосіївський",place:"вул. Васильківська, 2",at:[30.50717,50.39765],days:["fri"],when:"Щоп’ятниці, 19:00",time:"19:00",age:[20,30],ageText:"20–30 років",url:U+"domashnya-grupa-oleksii-kuropata/"},   // колишня група Олексія Куропати, новий лідер
 {img:"bitsan",leader:"Ярослав Біцан",area:"Дніпровський",place:"просп. Миру",at:[30.6186,50.44425],days:["tue"],when:"Щовівторка, 19:00",time:"19:00",age:[40,65],ageText:"40–65 років",url:U+"vtoraya-gruppa/"}
];
})();
