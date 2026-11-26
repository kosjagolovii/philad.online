/* Усі служіння церкви «Філадельфія».
   Поля: id (ім'я фото в min/<id>.webp), name, cat (ключ з CATS), text, lead (лідер, необов'язково), leadRole (підпис над іменем, за замовчуванням «Лідер служіння»), leadPhoto (кругле фото лідера, необов'язково), hero (головне фото, якщо воно не в min/hero/<id>.webp), leadNote (рядок під іменем, напр. «Пастор церкви»),
   img (інше фото замість min/<id>.webp), nophoto:true (фото ще немає — показати заглушку; приберіть, коли додасте min/<id>.webp), href (посилання «Детальніше» у вікні), page (своя сторінка: клік на картку одразу відкриває її).
   Порядок у списку = порядок на сторінці. archived:true — служіння сховане зі сторінки, дані лишаються. */
window.PHILAD_MIN_CATS=[
  {id:"pray",label:"Поклоніння і молитва"},
  {id:"kids",label:"Діти"},
  {id:"young",label:"Молодь"},
  {id:"family",label:"Сім’я і спільнота"},
  {id:"help",label:"Допомога людям"},
  {id:"evang",label:"Євангелізація"},
  {id:"faith",label:"Віра і навчання"},
  {id:"team",label:"Команди церкви"}
];
window.PHILAD_MIN=[
  {id:"youth",page:"/project/philadyouth/",hero:"youth/hero.webp",name:"Молодіжне служіння",cat:"young",text:"Молодь 16–25 років: зустрічі, дружба, служіння і чесні розмови про віру та життя."},
  {id:"prayer",lead:"Анатолій Фещенко",leadRole:"Лідер служіння",leadNote:"Старший пастор",leadPhoto:"min/leaders/feshchenko-prayer.webp",name:"Молитовне служіння",cat:"pray",text:"Молимося за церкву, за людей, які просять про молитву, і за Україну. Долучитися може кожен."},
  {id:"wednesday",name:"Вечірнє служіння по середах",cat:"pray",lead:"Регіональний служитель",text:"Зібрання посеред тижня: Слово, молитва і спілкування, щоб не чекати неділі."},
  {id:"night",lead:"Андрій Лещук",leadRole:"Лідер служіння",leadPhoto:"min/leaders/teens.webp",name:"Нічні молитви",cat:"young",text:"Нічні молитовні зустрічі молоді — час, коли без поспіху шукаємо Бога разом."},
  {id:"vpb",name:"Вечір Пошуку Бога (ВПБ)",cat:"pray",lead:"Шашлов Андрій",leadPhoto:"min/leaders/vpb.webp",text:"Вечір поклоніння і молитви, на якому разом шукаємо Бога."},
  {id:"homegroups",name:"Домашні групи",cat:"family",lead:"Лідери домашніх груп у своїх районах",href:"/domashnie-gruppy/",text:"Невеликі групи по всьому Києву, де разом читають Біблію, моляться і підтримують одне одного."},
  {id:"worship",name:"Служіння прославлення",cat:"pray",lead:"Тимофій Ярошевич",leadRole:"Лідер прославлення",leadPhoto:"min/leaders/worship.webp",text:"Музиканти і вокалісти, які ведуть церкву в поклонінні на богослужіннях."},
  {id:"sunday-school",name:"Недільна школа",cat:"kids",lead:"Світлана Поліщук",leadRole:"Директорка недільної школи",leadPhoto:"min/leaders/sunday-school.webp",text:"Поки дорослі на богослужінні, діти вивчають Біблію, граються і дружать у групах за віком."},
  {id:"kids-choir",name:"Дитячий хор",cat:"kids",text:"Діти вчаться співати разом і служать піснями на богослужіннях і святах."},
  {id:"choir",name:"Дорослий хор",cat:"pray",text:"Хор церкви славить Бога піснями на богослужіннях і святкових зібраннях."},
  {id:"camps",lead:"Світлана Рибальченко",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/rybalchenko.webp",name:"Дитячі табори",cat:"kids",text:"Літні табори для дітей церкви та їхніх друзів: природа, ігри, наставники і біблійні уроки."},
  {id:"teens",name:"Служіння підліткам",cat:"young",lead:"Лещук Андрій",leadRole:"Лідер підліткового",leadPhoto:"min/leaders/teens.webp",text:"Зустрічі для підлітків: ігри, розмови на важливі теми, молитва і друзі."},
  {id:"happiness",name:"Щастя поруч",cat:"young",lead:"Юрій Кавун",leadRole:"Лідер служіння",leadNote:"Пастор церкви",leadPhoto:"min/leaders/kavun.webp",text:"Молодіжний рух, де вчаться будувати стосунки так, як їх задумав Бог, і знайомляться в християнській атмосфері."},
  {id:"chaplain",lead:"Володимир Губський",leadRole:"Капелан",leadPhoto:"min/leaders/chaplain.webp",name:"Капеланство",cat:"help",text:"Капелани підтримують військових, поранених і їхніх рідних словом, молитвою і присутністю."},
  {id:"mil-families",lead:"Тетяна Василенко",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/mil-families.webp",name:"Служіння сім’ям військових",cat:"help",text:"Підтримуємо дружин, дітей і батьків тих, хто служить: розмова, молитва і практична допомога."},
  {id:"szho",lead:"Олена Балабан",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/balaban.webp",name:"Служіння сім’ям СЖО",cat:"help",text:"Поруч із родинами в найважчі часи: підтримка, молитва і допомога."},
  {id:"evacuation",lead:"Андрій Николаєв",leadRole:"Лідер служіння",leadPhoto:"min/leaders/nykolaiev.webp",name:"Евакуація людей",cat:"help",text:"Волонтери церкви допомагають людям виїхати з небезпечних районів і дістатися безпечного місця."},
  {id:"day-center",archived:true,name:"Денний центр у «Філадельфії»",cat:"help",text:"Місце, куди можна прийти вдень: гаряча їжа, тепло, спілкування і підтримка."},
  {id:"settlement",lead:"Володимир Рудницький",leadRole:"Лідер служіння",leadPhoto:"min/leaders/rudnytskyi.webp",name:"Поселення евакуйованих людей",cat:"help",text:"Допомагаємо людям, які втратили дім через війну, знайти житло й облаштуватися на новому місці."},
  {id:"social",lead:"Володимир Рудницький",leadRole:"Лідер служіння",leadPhoto:"min/leaders/rudnytskyi.webp",name:"Соціальна робота",cat:"help",text:"Гуманітарна допомога тим, хто її потребує: продукти, речі та супровід."},
  {id:"seekers",lead:"Ярослав Біцан",leadRole:"Лідер служіння",leadPhoto:"min/leaders/bitsan.webp",name:"Групи вивчення Біблії з неоцерковленими",cat:"evang",text:"Зустрічі для тих, хто ще шукає: тут можна поставити будь-яке питання і разом читати Біблію."},
  {id:"limetels",lead:"Володимир Ізгаршев",leadRole:"Лідер служіння",leadPhoto:"min/leaders/izgarshev.webp",name:"Limitless (Лімітлес)",cat:"evang",text:"Детальніше про це служіння розповімо зовсім скоро."},
  {id:"blagovistia",lead:"Вадим Павленко",leadRole:"Лідер служіння",leadPhoto:"min/leaders/pavlenko.webp",name:"Служіння Благовістя",cat:"evang",text:"Несемо Євангеліє людям: розповідаємо про Христа там, де вони живуть, працюють і шукають відповіді."},
  {id:"light-bread",name:"Світло і Хліб",cat:"evang",lead:"Борис Корбан",leadPhoto:"min/leaders/light-bread.webp",text:"Служіння просто неба: тепло, хліб і добре слово для людей, які проходять повз наш намет."},
  {id:"premarital",lead:"Юрій Кавун",leadRole:"Лідер служіння",leadNote:"Пастор церкви",leadPhoto:"min/leaders/kavun.webp",name:"Консультування пар до одруження",cat:"family",text:"Зустрічі з досвідченими подружжями для пар, які готуються до весілля."},
  {id:"family-nights",lead:"Ефе Прінц",leadRole:"Лідер служіння",leadPhoto:"min/leaders/prinz.webp",name:"Сімейні вечори",cat:"family",text:"Вечори для подружжів: час одне для одного, розмови і спілкування з іншими сім’ями."},
  {id:"young-families",lead:"Прінц Ефе",leadRole:"Лідер служіння",leadPhoto:"min/leaders/young-families.webp",name:"Праця з молодими сім’ями",cat:"family",text:"Підтримка молодих подружжів і батьків: зустрічі, поради та друзі на тому ж етапі життя."},
  {id:"plus37",lead:"Альона Рісто",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/plus37.webp",name:"Служіння 37+",cat:"family",text:"Спільнота для тих, кому 37 і більше: дружба, підтримка і служіння разом."},
  {id:"media",page:"/project/media-sluzhinnya/",name:"Медіа команда",cat:"team",text:"Трансляції, фото, відео і соцмережі: розповідаємо про життя церкви і несемо Євангеліє далі."},
  {id:"hospitality",lead:"Віктор Осташевський",leadRole:"Лідер служіння",leadPhoto:"min/leaders/ostashevskyi-hospitality.webp",name:"Група гостинності",cat:"team",text:"Зустрічаємо людей на вході, пригощаємо кавою і допомагаємо новим гостям почуватися вдома."},
  {id:"order",lead:"Віктор Осташевський",leadRole:"Лідер служіння",leadPhoto:"min/leaders/ostashevskyi.webp",name:"Група порядку",cat:"team",text:"Дбаємо, щоб на богослужіннях було зручно і спокійно: зустрічаємо, підказуємо, допомагаємо знайти місце."},
  {id:"special-kids",lead:"Юлія Николайчук",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/nykolaichuk.webp",name:"Служіння дітям з інвалідністю",cat:"help",text:"Зустрічі, турбота і підтримка для дітей з інвалідністю та їхніх батьків."},
  {id:"front",lead:"Віталій Руденко",leadRole:"Лідер служіння",leadPhoto:"min/leaders/rudenko.webp",name:"Служіння на фронті",cat:"help",text:"Капелан їздить до військових на передову з підтримкою, молитвою і Словом."},
  {id:"women",lead:"Наталія Вольвачева",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/women.webp",name:"Жіноче служіння",cat:"family",text:"Зустрічі для жінок: Слово, молитва, розмови і підтримка одна одної."},
  {id:"sisters",lead:"Тетяна Кобрій",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/sisters.webp",name:"PhiladGirls (Служіння сестрам)",cat:"young",text:"Теплі зустрічі для незаміжніх сестер за чаєм: розмови, молитва і підтримка."},
  {id:"think",lead:"Анатолій Фещенко",leadRole:"Лідер служіння",leadNote:"Старший пастор",leadPhoto:"min/leaders/feshchenko-think.webp",name:"«Думай глибше»",cat:"faith",text:"Інтелектуальна платформа: лекції і дискусії про віру, науку, культуру та складні питання."},
  {id:"first-steps",lead:"Олексій Вольвачев",leadRole:"Лідер служіння",leadNote:"Диякон",leadPhoto:"min/leaders/volvachev.webp",name:"Перші кроки з Богом",cat:"faith",text:"Особливі зустрічі для тих, хто робить перші кроки з Богом, хоче прийняти водне хрещення або дізнатися більше про основи віри — у дружній атмосфері колективних обговорень."},
  {id:"baptism",lead:"Олексій Вольвачев",leadRole:"Лідер служіння",leadNote:"Диякон",leadPhoto:"min/leaders/volvachev.webp",name:"Підготовка до водного хрещення",cat:"faith",text:"Курс для тих, хто вирішив прийняти водне хрещення: основи віри, Писання і сенс хрещення."},
  {id:"films",lead:"Софія Головій",leadRole:"Лідерка служіння",leadPhoto:"min/leaders/sofiia.webp",name:"Philad Films",cat:"team",text:"Знімаємо фільми та історії про віру і людей нашої церкви."}
];

/* Кожне служіння має власну сторінку: ministry.html#<id> (шаблон; тексти — min/pages.js).
   Молодіжне і домашні групи мають свої окремі сторінки (поле page вище / нижче). */
window.PHILAD_MIN_SLUGS={"prayer":"molytovne-sluzhinnia","worship":"proslavlennya","sunday-school":"nedilna-shkola","camps":"detskiy-lager","teens":"pidlitkove-sluzhinnya","chaplain":"kapelanstvo","special-kids":"proverka-skrolera","settlement":"sluzhinnya-pereselencyam","baptism":"obuchenie-pervye-shagi-v-vere","sisters":"sluzhenie-dlya-sester","young-families":"sluzhenie-semyam","happiness":"sshastya-poruch","wednesday":"vechirnie-sluzhinnia-po-seredakh","night":"nichni-molytvy","kids-choir":"dytiachyi-khor","choir":"doroslyi-khor","mil-families":"sluzhinnia-simiam-viiskovykh","szho":"sluzhinnia-simiam-szho","evacuation":"evakuatsiia-liudei","social":"sotsialna-robota","seekers":"hrupy-vyvchennia-biblii","limetels":"limitles","premarital":"konsultuvannia-par-do-odruzhennia","family-nights":"simeini-vechory","plus37":"sluzhinnia-37-plus","hospitality":"hrupa-hostynnosti","order":"hrupa-poriadku","front":"sluzhinnia-na-fronti","women":"zhinoche-sluzhinnia","think":"dumai-hlybshe","films":"philad-films","first-steps":"pershi-kroky-u-viri","vpb":"vechir-poshuku-boha","blagovistia":"sluzhinnia-blahovistia","light-bread":"svitlo-i-khlib"};   // id служіння → адреса /project/<slug>/ (зі старого сайту; для нових служінь — латинський slug за назвою) (сторінку створює build-urls.py)
window.PHILAD_MIN.forEach(function(m){
  const PS=window.PHILAD_MIN_SLUGS;
  if(m.page)return;
  m.page=m.id==="homegroups"?"/domashnie-gruppy/":PS[m.id]?"/project/"+PS[m.id]+"/":"/ministry.html#"+m.id;   // PS: служіння, що мали свою сторінку /project/<slug>/ на старому сайті
});
