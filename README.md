# Navi Astro (Astro 5 + Tailwind)

- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Cloudflare Pages

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18+

## Структура

- `src/pages/` — страницы Astro
- `src/layouts/` — базовые layout'ы
- `src/styles/` — глобальные стили (Tailwind directives)

## Tailwind
Tailwind подключён через `@astrojs/tailwind`, PostCSS настроен.

## Техническая конфигурация фронтенда

Astro 5 (SSG, острова по месту, контент через Content Collections: Markdown/MDX).
Tailwind CSS (@astrojs/tailwind, типографика для статей).
Изображения: встроенный `<Image />` из Astro 5 (плюс lqip/blur placeholders), источники — локальные + CDN (Cloudflare R2/Images).
i18n: многоязычность RU/UA/EN/FR с локализованными slug’ами и hreflang (роутинг на базе i18next/own router; для SeaVenture — включены RU/UA).
Поиск: Pagefind (статический индекс, многоязычный).
SEO-пакет: каноникал, OG/Twitter, JSON-LD (BlogPosting/CollectionPage/FAQPage/VideoObject), @astrojs/sitemap, robots.txt.
Аналитика: GA4 (через gtag.js или Cloudflare Zaraz).
Деплой: Cloudflare Pages (+ правила кэширования для HTML/JSON, Brotli, HTTP/3, Rocket Loader — off).
Карты/виджеты по требованию: острова React/Preact для интерактивных блоков (карты, фильтры).
Качество кода: ESLint + Prettier, Husky (pre-commit) — опционально.
