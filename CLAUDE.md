# PB Notes (pb-journaling)

Read `AGENTS.md` (Expo guidance) and `PLAN.md` (roadmap and status) before starting work.

## Keep PLAN.md current

- Check off items in `PLAN.md` as they are completed, in the same commit as the work.
- Record product or technical decisions in the **Decisions log** with the date.

## Project rules

- Separate app from Healthy Habits: no shared code or packages. Patterns may match, code is its own.
- Local first: no network calls, analytics or accounts. Data never leaves the device except through an export the user starts.
- Styling uses `createStyles()` from `src/theme`. Define styles outside components. No hardcoded colors, spacing or font sizes.
- Item colors are stored by name (`itemColors` in `src/theme/tokens.ts`), never as hex.
- Database: edit `src/db/schema.ts`, then `npm run db:generate`. Never edit generated files in `drizzle/` except `migrations.d.ts`. Never delete user data to fix a migration.
- All library reads and writes go through `src/features/library/library.ts` (tested in Jest against real SQLite).
- Screens use `useLive` (`src/db/useLive.ts`) for data that must refresh when other tables change.
- Settings live in the `settings` table through `useSetting` (`src/features/settings/settings.ts`). Lock settings are the exception: they live in secure storage.
- Secrets (PIN, password) are stored only as salted hashes in `expo-secure-store`, never in SQLite or plain text.
- Locked items (or anything inside a locked collection or book) never show their text outside their own screen: not in search, previews or exports unless the person chose that.
- The editor page lives in `editor-web/`. After changing it (or `blocksProtocol.ts`), run `npm run editor:build` and commit the regenerated `src/features/editor/editorHtml.js`.
- Built in template ids (`builtin-…`) are permanent. Change their content freely; never rename or reuse an id.
- Photo files live in the app's `photos/` folder and can be shared by copies of a note. Delete files only through `cleanOrphanPhotos`.
- Developer tools (`src/app/(tabs)/settings/developer.tsx`) show only when `devToolsEnabled` (dev server or the development build).
- Nothing fails silently: event handlers pass promises to `run()` from `src/lib/errors`.
- Before finishing: `npm run typecheck`, `npm run lint`, `npm test`. For UI changes also `npm run e2e:build && npm run e2e`.

## Environment notes

- `npx expo install` needs the Expo API. If it is blocked, `EXPO_OFFLINE=1 npx expo install <pkg>` uses the SDK's bundled version list.
- Web is not a target platform; it is only used for browser tests and screenshots. Set `PW_CHANNEL=chrome` to run Playwright with an installed Chrome.
