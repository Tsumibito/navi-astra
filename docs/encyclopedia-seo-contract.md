# Encyclopedia SEO contract

Each term page owns one informational entity and must answer the query before expanding it. The hub owns broad queries such as “яхтенная энциклопедия” and “яхтенные термины”; individual entries must not repeat those phrases mechanically.

## Query hierarchy

1. Primary: `что такое {термин}`, `{термин} — это`, `{термин} на яхте / в яхтинге`.
2. Practical: `для чего нужен {термин}`, `как работает {термин}`, `как использовать {термин}`.
3. Disambiguation: `{термин} и {связанный термин} разница`, `чем отличается X от Y`.
4. Safety or operation, only when supported: `ошибки`, `настройка`, `проверка`, `безопасность`.

RU, UK and EN are separate localized intents, not literal keyword substitutions. Titles should use the natural primary question when it matches the term. The first paragraph gives the concise definition; the remaining copy supplies context, application, limits and related concepts.

## FAQ rules

- Use 2–4 questions that add retrieval value; do not restate the same definition four times.
- Prefer authored CMS `faqs`. A deterministic fallback may only combine existing definition, usage notes and verified related entities.
- Never invent numeric limits, regulations, safety advice or comparisons.
- Render visible accordions and matching `FAQPage` JSON-LD. Structured data must contain exactly the visible questions and answers.
- Link to the encyclopedia hub, 2–4 genuinely related terms, and relevant blog/tag pages when present. Avoid orphan entries and mass exact-match anchors.

## Publication gate

Every localized entry needs a unique title, description, canonical, reciprocal hreflang, definition, useful body, source provenance and direct internal links. FAQ generation cannot make a thin entry publishable by itself.
