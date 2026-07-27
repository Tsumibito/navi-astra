# Navi.training — native Astro

Полностью нативная статическая версия на Astro. Все публичные маршруты строятся
из нативных компонентов, Payload JSON (`src/data/payload-*.json`) и
`src/data/legal.json`.

## Команды

- `npm run dev` — локальная разработка.
- `npm run build` — собрать 536 статических страниц и запустить parity gate.
- `npm run check` — только `astro check` (read-only).
- `npm run validate` — повторно проверить готовую сборку.
- `npm run generate:sitemap` — перегенерировать `public/sitemap.xml`.
- `npm run sync:payload-content` — явная maintenance-команда: загрузить контент
  из Payload.
- `npm run sync:payload-certificates` — явная maintenance-команда: загрузить
  сертификаты из Payload.
- `npm run generate:webp` — явная maintenance-команда: создать WebP-варианты
  изображений и `src/data/image-dims.json`.
- `npm test` — запустить unit/контрактные тесты.
- `npm run deploy:cloudflare` — собрать и загрузить проект в Cloudflare Pages.

## Источники данных

- Контент блога, страниц команды и SEO: `src/data/payload-content.json`.
- Сертификаты и курсы: `src/data/payload-certificates.json`.
- Юридические страницы: `src/data/legal.json`.
- Общая оболочка (Header/Footer) и URL: `src/lib/site-shell.mjs`.

Сборка полностью offline/read-only: `npm run build` не обращается к Payload.

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `22`

`wrangler.jsonc`, `_headers`, `robots.txt` и `sitemap.xml` входят в проект.
Preview-домены `*.pages.dev` получают `X-Robots-Tag: noindex`, чтобы не создавать
SEO-дубликаты до подключения основного домена.

## Контракты разработки

- `AGENTS.md` — обязательная точка входа для любого SWE-агента.
- `design.md` — визуальный и компонентный контракт.
- `docs/ENGINEERING_STANDARD.md` — производительность, SEO, доступность,
  данные и обязательная проверка новых страниц.
- `docs/zaraz-consent.css` — исходник опубликованного Custom CSS Zaraz.
- `docs/modernization-plan.md` — исторический план миграции, не текущая
  инструкция.

## Текущее состояние

- 529 индексируемых URL в `public/sitemap.xml`.
- `npm run build` генерирует 536 страниц.
- `node scripts/audit-route-ownership.mjs` возвращает `conflicts: 0`,
  `missing: 0`.
- `src/snapshots/`, `src/pages/[...path].astro` и Webstudio-importer удалены.
- Активные landing-стили `navi-runtime.css`, `navi-evolution-v1.css` и
  `navi-standard-v1.css` пока сохраняются из-за `LandingLayout`.
