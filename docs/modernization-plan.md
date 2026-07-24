# План модернизации Navi.training (эволюция без смены восприятия)

Цель: меньше клиентского JS, современный нативный HTML/CSS, компонентность.
Внешний вид и композиция страниц **не меняются** — это жёсткое требование.
Реализуют младшие модели небольшими независимыми задачами. Бюджет до релиза
ограничен, поэтому у каждой задачи есть приоритет и грубая оценка стоимости.

## Обязательные правила для исполнителя

1. Прочитай `design.md` и `AGENTS.md` перед любой правкой страниц.
2. Одна задача = один коммит в `main` (репозиторий navi-astra, Node 22:
   `export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"`).
3. Перед коммитом обязательно: `npx astro check` (0 ошибок) и локальный билд
   `npm run apply:payload-certificates && npm run apply:payload-content &&
   npm run generate:sitemap && npx astro build && node scripts/validate-build.mjs`
   (sync:payload-* локально не запускать — ключи только в Cloudflare).
4. Визуальная проверка: `node scripts/design-compare.mjs --out /tmp/shots
   --widths 1440,390 "page=http://localhost:4321/<route>"` — скриншот ДО и
   ПОСЛЕ правки должен совпадать (допуск — только исчезновение артефактов).
5. Не трогай снапшоты (`src/snapshots/**`) и их нормализатор.
6. Фичи «с progressive enhancement» обязаны корректно работать в браузерах
   без поддержки (feature-query `@supports` / проверка в JS). Никаких
   экспериментальных customizable `<select>` и interest invokers.
7. Общее правило компонентности: повторяющийся блок (карточка, отзыв,
   статья, шаг, таб) живёт в `src/components/*` и настраивается пропсами;
   страничные файлы — только композиция и данные из `src/data/pages/*`.

## Текущее состояние (чтобы не искать заново)

- Фреймворк-островов нет вообще: ни React, ни `client:load`. Весь JS — это
  небольшие инлайн-скрипты: Header (бургер), ServiceLeadForm (модалка+fetch),
  CertificatesTabs и InshorePage (табы), navi-runtime.js (только снапшоты).
- FAQ уже на нативном `<details>`. Общие стили страниц — `src/styles/
  stacked-pages.css` (np-*), токены — `design-system.css`, `global.css`.
- Нативные страницы: home, charter, sailing-school, inshore-skipper-sail,
  blog, tags, team, encyclopedia, legal, сервисные, статусные.
- Снапшотами остались только standalone-лендинги `charter-for-dummies`
  (ru/ua) и `yahting-dlya-vseh` (ru) + прочие не входящие в релизный список.

## Задачи

### P0 — до релиза

T1. **Лендинги charter-for-dummies (ru/ua) и yahting-dlya-vseh (ru) → native.**
Порядок как в memory/воркфлоу: замеры прода playwright-скриптом, контент
дословно из снапшотов в `src/data/pages/*.json` (опечатки исправлять),
компоненты переиспользовать (ReviewsCards, FaqAccordion, StepsCard).
ВАЖНО: без общего Header/Footer/PhotoStrip — валидатор запрещает shell на
этих маршрутах; сделать лёгкий `LandingLayout.astro`. Обновить regex в
`src/pages/[...path].astro` и `nativeOverrides` в `scripts/validate-build.mjs`.
Оценка: ~3–4 € токенов. Это самая большая задача.

T2. **Модалка заявки на `<dialog>`.** `ServiceLeadForm.astro`: заменить
div-оверлей на `<dialog>` (showModal/close): нативные Esc, фокус-трап,
::backdrop (стили backdrop перенести 1-в-1). Убрать ручной `navi-modal-open`
класс — использовать `body:has(dialog[open]) { overflow:hidden }`.
Прогрессивно: кнопки открытия перевести на `commandfor`/`command="show-modal"`
c JS-фолбэком (текущий обработчик оставить для браузеров без Invoker API).
Визуально ничего не меняется. Проверить открытие на /, /ru/charter,
/ru/sailing-school, /ru/yacht-delivery (ServiceLayout использует те же классы —
не сломать; его собственная копия формы должна продолжить работать или тоже
перейти на компонент). Оценка: ~1 €.

T3. **Нативная валидация формы.** В той же форме: `required` уже есть;
добавить `type="tel"` + `autocomplete`, стилизацию `:user-invalid`
(подчёркивание поля цветом --ds-accent) и `aria-describedby` для статуса.
JS остаётся только на fetch-отправке. Оценка: ~0.5 €.

### P1 — производительность (визуально ничего не меняется)

T4. **Изображения.** Пройтись по нативным страницам: (а) у каждого `<img>`
есть width/height и `decoding="async"`; (б) LCP-картинки (hero) —
`fetchpriority="high"` + `<link rel="preload" as="image">` в BaseLayout через
проп `preloadImage`, остальные `loading="lazy"`; (в) hero-фоны секций
(np-hero) перевести с CSS background на абсолютно позиционированный `<img>`
с preload (композиция та же); (г) больших JPG из `/cgi/asset` сгенерировать
WebP-версии скриптом в `scripts/` и подключить через `<picture>`
(оригиналы не удалять). Оценка: ~1.5 €.

T5. **Самохостинг шрифтов.** Tenor Sans (+Manrope для сервисных страниц)
положить в `public/fonts/*.woff2`, `@font-face` с `font-display: swap` и
`size-adjust`-фолбэком под Arial; убрать запросы к fonts.googleapis.com из
BaseLayout/ServiceLayout. Проверить скриншотами — метрики строк не должны
сдвинуться заметно. Оценка: ~0.5 €.

T6. **Ревизия CSS-поставки.** `navi-evolution-v1.css` (43 КБ) грузится на
всех нативных страницах, но нужен им лишь частично (футер, navi-card--media,
encyclopedia, related-posts переменные). Выделить из него используемый
нативными страницами поднабор в `src/styles/evolution-native.css` (импорт в
BaseLayout вместо `<link>`), полный файл оставить только снапшотам.
Сверить скриншоты всех типов страниц (home, charter, школа, блог-пост, тег,
team, encyclopedia, legal). Рискованная задача — делать последней в P1.
Оценка: ~1.5 €.

### P2 — современный CSS вместо JS/медиа-запросов

T7. **Эксклюзивный аккордеон FAQ.** `FaqAccordion.astro`: добавить
`name="faq-<uid>"` на `<details>` — нативное «один открыт» без JS (как в
Webstudio-оригинале). Плюс плавное раскрытие через
`interpolate-size: allow-keywords` + `transition: height` в `@supports`.
Оценка: ~0.3 €.

T8. **Container queries для переиспользуемых карточек.** ReviewsCards,
InstructorsGrid, PracticeBases, navi-rp (RelatedPosts), карточки блога:
заменить страничные `@media` на `container-type: inline-size` у сетки и
`@container`-правила у карточки. Поведение на текущих страницах идентично,
но компоненты станут корректны в любом контейнере. Делать по одному
компоненту на коммит со скриншот-проверкой. Оценка: ~1 €.

T9. **clamp()-типографика в stacked-pages.css.** Заменить пары
«десктоп px + мобильный px в @media» на `clamp()` с теми же крайними
значениями (контроль: скриншоты на 1440 и 390 должны совпасть с текущими,
промежуточные ширины станут плавнее). Не трогать значения, замеренные с
оригинала, на крайних точках. Оценка: ~0.7 €.

T10. **Мобильный drawer хедера.** `Header.astro` + BaseLayout: перевести
бургер-меню на Popover API (`popover` + `popovertarget`) с CSS-переходами и
`inert`-фоном, JS-фолбэк для старых браузеров сохранить. Слои по design.md
(10020/10030). Оценка: ~1 €.

### P3 — прогрессивные украшения (могут подождать релиза)

T11. **View Transitions между страницами.** CSS-правило `@view-transition
{ navigation: auto; }` + именованные transition для хедера/футера, чтобы они
не мигали. Проверить, что инлайн-скрипты страниц переживают навигацию
(они инициализируются заново при MPA-переходе — ок). Оценка: ~0.5 €.

T12. **Scroll-driven reveal.** Едва заметный fade/rise (8–12px, 0.4s) для
карточек в сетках через `animation-timeline: view()` строго внутри
`@supports (animation-timeline: view())` и с `prefers-reduced-motion: no-preference`.
Не применять к hero и текстовым секциям. Оценка: ~0.5 €.

T13. **Надёжность внешних ассетов.** Постеры отзывов и фото направлений
живут на baserow S3 — перекачать в `public/` (или R2) скриптом, обновить
пути в `src/data/pages/*.json`. Визуально то же, убирает зависимость от
чужого хостинга. Оценка: ~0.7 €.

### Явно НЕ делаем

- HTMX — не подключаем: серверных сценариев, которые он упростил бы, на
  статическом сайте нет; форма уже 20 строк fetch.
- Anchor Positioning — нет ни одного тултипа/поповера, где он нужен.
- Смену композиции, цветов, радиусов, теней — запрещено design.md.

## Порядок и бюджет

T1 → T2 → T3 → T4 → T5 → T7 → T9 → T8 → T6 → T10 (итого ~10.7 €; T11–T13
после релиза, если бюджет останется). Если бюджет поджимает — T6, T8 и T10
переносятся за релиз без последствий.
