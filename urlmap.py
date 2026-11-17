"""Адреси сторінок сайту = адреси старого philad.org. Один словник на весь проєкт.
  CLEAN  — головний файл сторінки (редагується тут) → її адреса на сайті (така сама, як була на старому philad.org).
Копії сторінок за цими адресами створює build-urls.py; посилання скрізь пишуться вже як /адреса/."""
CLEAN = {
    "about.html": "pro-nas",
    "events.html": "cobytiya",
    "ministries.html": "sluzhinnya",
    "homegroups.html": "domashnie-gruppy",
    "homegroup-themes.html": "zavhdi_molytysya_i_ne_zanepadaty_duhom",
    "seek-god.html": "poshuk-boga",
    "donate.html": "donate",
    "live.html": "online-translyaciya",
    "contacts.html": "contacts",
    "blog.html": "category/vse_zapisi",
    "videos.html": "video",
    "events-archive.html": "events",
    "sermons.html": "category/sermon",
    "youth.html": "project/philadyouth",
    "history.html": "history",
    "first-visit.html": "first-visit",
    "privacy-policy.html": "privacy-policy",
}
def url(f):
    """файл → адреса на сайті, напр. about.html → /pro-nas/"""
    if f == "index.html": return "/"
    return "/" + CLEAN[f] + "/" if f in CLEAN else "/" + f
