# Як влаштований сайт і як додавати сторінки

Правило: **усе, що повторюється, живе в одному місці** — зміна там змінює всі сторінки, що його використовують.
Текст і кольори беруться з UI-кіта, а не пишуться на сторінці.

## 1. UI-кіт — єдине джерело тексту й кольору
`site/ui-kit/tokens.css` (на сайті доступний як `ui-kit/tokens.css`, це символьне посилання). Токени:
H1 · **D1** (великий заголовок внутрішніх сторінок) · H2 · **H2S** (заголовок розділу між H2 і H3) · H3 · T1 · T2 · T3 · **B1** (текст для читання) та кольори (`--cream`, `--night`, `--teal`, `--card`, `--mute`…).
У стилях: `font:var(--h2-weight) var(--h2-size)/var(--h2-lh) var(--font);letter-spacing:var(--h2-track)`.
**Не пишіть** на сторінці власні `font-size`/`letter-spacing` для заголовків і тексту — беріть токен. Потрібен новий стиль — додайте його в `tokens.css`.

## 2. Спільні компоненти
| Що | Де | Хто використовує |
|---|---|---|
| Меню, футер, сітка `--row`, кнопка `.lbtn`, дані сайту (`SITE`) | `components/site.js` | усі сторінки |
| Список у стилі блогу (вкладки, теми, пошук, автопідвантаження) | `blog/base.css`, `blog/list.css`, `blog/lib.js`, `blog/list.js` | блог, архів подій |
| Список у стилі «Проповідей» (бічна панель фільтрів, картки, плеєр) | `sermons/base.css`, `sermons/page.css`, `sermons/base.js`, `sermons/page.js` | проповіді, відеобібліотека |
| Сторінка запису (стаття, відео, подія) | `blog/post.css`, `blog/post.js` (+ шаблон у `build-blog-pages.py`) | блог, відеобібліотека, архів подій |
| Лайтбокс (збільшення фото зі стрілками) | `components/lightbox.css`, `components/lightbox.js` → `PhiladLightbox.attach(imgs)` | історія, блог, відео, події |
| Сторінка домашньої групи | `homegroups/group.css` + `build-group-pages.py` (дані — `groups/data.js`) | 34 групи: `homegroups/<slug>/` |
| Правки лише одного розділу | `blog/section-blog.css`, `library/section-video.css`, `library/section-events.css` | відповідний розділ |

Сторінка списку — лише налаштування: `window.PHILAD_LIST={…}` (стиль блогу) або `window.SM_CONFIG={…}` (стиль проповідей) + підключення файлів.
Згенеровані сторінки записів містять тільки посилання на спільні CSS/JS — жодного вбудованого стилю.
Хочете змінити вигляд відеобібліотеки — `library/section-video.css` (лише вона) або `sermons/*` (разом із проповідями).

## 3. Футер виїжджає з-під останнього блоку (обов'язково для кожної сторінки)
Футер — `position:sticky;bottom:0` (у `site.js`), блок над ним має `position:relative`, `z-index` вище й **власний непрозорий фон**.
Шаблон нової сторінки:
```html
<site-menu tone="auto"></site-menu>
<div class="end"><div class="hold">          <!-- .end{z-index:3} .hold{z-index:1;background:var(--cream)} -->
  <main class="pg">…</main>
</div><site-footer></site-footer></div>
```
Якщо про це забули, `<site-footer>` сам виправляє `<main>` перед собою (функція `revealFix` у `site.js`).

## 4. Форми
Усі форми надсилають дані через `SITE.send(тема, {поле: значення})` (`site.js`) на адресу `SITE.formEmail` (зараз `media@philad.org`).
Змінити адресу — лише там. На localhost нічого не надсилається (лише пише в консоль). Перший лист після зміни адреси просить власника пошти підтвердити її (сервіс formsubmit.co).

## 5. Порядок оновлення даних
1. `python3 update-blog.py` → `python3 build-blog-pages.py` (блог, 70 записів зі старого сайту)
2. `python3 update-library.py` → `python3 build-library-pages.py` (відеобібліотека, архів подій)
3. `python3 build-group-pages.py` (сторінки домашніх груп з `groups/data.js`)
4. `python3 seo-apply.py` — завжди **останнім**: title, description, canonical, JSON-LD, sitemap, robots.txt, redirects.csv
Проповіді: `python3 update-sermons.py`. Теми домашніх груп: `update-hgthemes.sh`.

## 6. Розмітка відео (теми й спікери)
Правила для назв російською та спікера з опису відео — `library/classify.py` (словники `RU_TOPICS`, `FIRST`, `ALIAS`). Українські правила тем — `sermons/taxonomy.json`. Після змін: `python3 build-library-pages.py`.

## 7. Адреси сторінок = адреси старого philad.org
Таблиця — `urlmap.py` (файл сторінки → адреса, напр. `about.html` → `/pro-nas/`, `blog.html` → `/category/vse_zapisi/`, `videos.html` → `/video/`).
- **Редагуєте** головний файл (`about.html`, `ministries.html`…). `seo-apply.py` наприкінці запускає `build-urls.py`, який створює копію за чистою адресою (`pro-nas/index.html`) з `<base href="/">` і `components/base-fix.js`. Головний файл закривається від індексації (noindex), індексується лише копія.
- **Посилання** в коді пишіть уже чистими: `/pro-nas/`, `/sluzhinnya/` (не `about.html`). Нова сторінка зі старим аналогом: додайте рядок у `CLEAN` в `urlmap.py`.
- Записи блогу — `/<категорія>/<slug>/` як на старому сайті (`update-blog.py` бере адресу з поля `link`), відео — `/video/<slug>/`, події — `/events/<slug>/`, групи — `/groups/<slug>/`, служіння зі старою сторінкою — `/project/<slug>/` (мапа `PHILAD_MIN_SLUGS` у `min/data.js`).
- Сайт має стояти в корені домену (через `<base href="/">`), не в підпапці `github.io/назва/`.
- Ключ YouTube API: `/Users/…/philad.org/.secrets/youtube-api-key.txt` (поза папкою сайту). Повне оновлення проповідей: `YOUTUBE_API_KEY=$(cat ../../.secrets/youtube-api-key.txt) python3 update-sermons.py`.
