# Navi.training — Astro mirror

Первая статическая Astro-версия опубликованного Webstudio-сайта. Каждый URL из
актуального sitemap импортируется как полный HTML-снимок с сохранением контента,
SEO-разметки, JSON-LD и дизайна.

## Команды

- `npm run dev` — локальная разработка.
- `npm run import:webstudio` — заново импортировать Webstudio и его ресурсы.
- `npm run build` — собрать 328 статических страниц и запустить parity gate.
- `npm run validate` — повторно проверить готовую сборку.
- `npm run deploy:cloudflare` — собрать и загрузить проект в Cloudflare Pages.

## Источники данных первой версии

- HTML и SEO: опубликованный `https://navi.training`.
- Статьи и их переводы: итоговый server-rendered HTML Webstudio; в нём текущим
  источником контента и медиа является Baserow.
- Webstudio CSS, шрифты и графика: локальная копия в `public/`.
- Изображения статей: прямые ссылки на исходное Baserow object storage.

Payload в первой версии не запрашивается во время build или runtime. Переход на
Payload/R2 должен выполняться отдельным этапом после content parity и publication
status gate, чтобы не заменить опубликованный контент черновиками миграции.

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `22`

`wrangler.jsonc`, `_headers`, `robots.txt` и `sitemap.xml` входят в проект.
Preview-домены `*.pages.dev` получают `X-Robots-Tag: noindex`, чтобы не создавать
SEO-дубликаты до подключения основного домена.

## Ограничения первого релиза

Страницы и статьи являются статическими снимками. Формы, аккордеоны и другие
сложные Webstudio-интеракции необходимо перенести в нативные Astro-компоненты до
окончательного отключения старого приложения. Контент, навигация и SEO-разметка
доступны без Webstudio/Remix hydration runtime.
