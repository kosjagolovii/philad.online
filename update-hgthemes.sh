#!/bin/sh
# Повне оновлення тем домашніх груп: нові теми з philad.org → дані списку → сторінки тем (+ sitemap).
# PDF окремо не генерується: його збирає браузер у момент кліку «Завантажити PDF».
cd "$(dirname "$0")" && python3 update-hgthemes.py "$@" && python3 build-hgtheme-pages.py all E
