# Frontend internationalization

## Architecture

The React frontend uses `i18next` and `react-i18next`. Initialization happens once in `apps/web/src/i18n/index.ts`, before React renders. English (`en`) is the deterministic default and fallback; Arabic (`ar`) uses right-to-left document direction.

```text
metaform-language
       |
       v
i18n/index.ts ----> <html lang dir>
       |
       +----> feature namespaces (en/ar)
       +----> LanguageSwitcher
       +----> Intl locale + translated enum helpers
```

No language-prefixed routes are used. Existing bookmarks and protected routes remain unchanged.

## Namespaces

- `common`: shared actions, states, units, pagination, validation, and enum labels
- `auth`: login, registration, auth errors, and auth validation
- `navigation`: shell, navigation, placeholders, and not-found states
- `dashboard`: overview, charts, trends, strength, and empty/error states
- `weightTracker`: machines, sessions, builder, sets, history, and dialogs
- `exerciseLibrary`: filters, cards, details, media, and pagination
- `nutrition`: profile prefill, form, results, latest, history, and disclaimer

Resources are TypeScript objects under `apps/web/src/i18n/locales`. The localization test verifies that every English leaf key exists in Arabic. Backend enum values and API contracts are never translated.

## Persistence and switching

`LanguageSwitcher` is shared by the authenticated TopBar and both authentication pages. The only localization value written to browser storage is `metaform-language`. Unsupported saved values fall back to English; browser-language detection is intentionally disabled.

The initializer centrally updates:

- English: `lang="en"`, `dir="ltr"`
- Arabic: `lang="ar"`, `dir="rtl"`

Logout does not clear the language preference. Access tokens remain memory-only.

## RTL strategy

Layout uses logical Tailwind utilities such as `start`, `end`, `ps`, `pe`, `ms`, `me`, and `border-e`. The desktop sidebar and mobile drawer therefore follow the document direction without duplicate components. Directional navigation icons rotate in RTL. Email, password, URL, and numeric inputs retain LTR direction where readability requires it.

Charts keep chronological data order; RTL does not reverse analytical meaning or media. The remaining physical `left` class is a decorative auth-page glow and is intentionally not mirrored.

## Enums, formatting, and validation

`i18n/enum-labels.ts` maps typed backend enums to `common.enums` translation keys. Do not add feature-local bilingual label maps.

`i18n/locale.ts` resolves `en-US` or `ar-SA`. Dashboard, Weight Tracker, Exercise Library, and Nutrition formatters use `Intl.NumberFormat` and `Intl.DateTimeFormat` with the active locale. ISO values sent to or received from APIs are unchanged.

Zod schemas are translation-aware factories. A component creates its schema from the current namespace translator, so one schema supports both languages and changes immediately with the UI language. Known authentication and feature failures use stable frontend codes or translated safe fallbacks; arbitrary Axios/backend prose is not rendered.

## Accessibility

- Document language and direction update without reload.
- The switcher is a labeled native select and exposes the active language.
- Screen-reader labels, live states, dialogs, media alternatives, pagination, and retry controls are translated.
- Focus order remains DOM-logical in both directions.
- The skip link and mobile focus management are preserved.
- Units remain explicit and BMI remains a neutral screening estimate.

## Testing

`apps/web/tests/internationalization.test.tsx` covers fallback resolution, saved preference restoration, switching, persistence, document language/direction, resource parity, shell/auth switchers, Arabic validation, current feature states, dialogs, and pagination. Existing feature suites provide regression coverage for routing and workflows.

## Adding a future feature

1. Add a semantic namespace resource in both `locales/en` and `locales/ar`.
2. Register both resources in `i18n/index.ts` and add the namespace to `i18n/types.ts`.
3. Use `useTranslation(namespace)` in presentation code; never branch manually on `language === 'ar'`.
4. Add typed enum labels to `common.enums` and `enum-labels.ts` when a shared API enum is introduced.
5. Use the locale utility and `Intl` for numbers and dates; do not format API ISO values manually.
6. Prefer logical layout utilities and manually verify desktop/mobile LTR and RTL. Do not reverse chronological chart data.
7. Add English, Arabic, accessibility, validation, and RTL assertions to the localization tests. Resource parity will catch missing Arabic keys.

## Known limitations

- Backend-generated messages and database content are not localized. The UI displays translated safe errors, while exercise descriptions and user content remain in their stored language.
- URLs do not encode language in this phase.
- Exercise videos and thumbnails are not mirrored or transformed.
- Workout Plans frontend is not implemented; its navigation placeholder is translated and shared plan enum helpers are ready for the next stage.
