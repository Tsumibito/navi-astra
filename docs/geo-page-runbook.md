# Adding a new geography page

1. Create `src/pages/draft/[locale]/{slug}.astro` with `getStaticPaths` for `ru`, `ua`, `en`.
2. Load the fact pack and route:
   - `const route = getRouteById('entity-type:slug');`
   - `const initialSearch = route ? defaultSearchState(route, locale) : null;`
3. Pass `BaseLayout` props:
   - `locale`, `title`, `description`;
   - `canonical = https://navi.training${path}`;
   - `languageHrefs` with the `/{locale}/{slug}/` or `/draft/{locale}/{slug}` triple;
   - `noindex` for every draft;
   - `structuredData` as a `BreadcrumbList` and the appropriate `Place`/`BoatTerminal`.
4. Add media credit:
   - Include `GeographyMediaCredit` at the bottom if the fact pack has `media_credit`.
   - Keep the component as-is; it renders the author/source/licence/derivatives line.
5. Add scoped rails:
   - `const baseIds = new Set(route?.base_ids ?? []);`
   - `const scopedYachts = getYachtInventory('fixture').filter(y => (y.baseId && baseIds.has(y.baseId)) || y.baseFromIds.some(id => baseIds.has(id)));`
   - Render `YachtRail` with `locale`, `title`, `empty`, `searchState={initialSearch}`.
   - `YachtCard` will append the `searchState` query to detail links automatically.
6. Add the shared `YachtSearch` form with `route={route}`, `initialState={initialSearch}`.
7. Run `npx astro check`, `npm run build`, `npm test` before commit.
8. No manual client controller: `YachtSearchClient` is included on the search page only.
