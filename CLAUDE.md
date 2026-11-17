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
- Nothing fails silently: event handlers pass promises to `run()` from `src/lib/errors`.
- Before finishing: `npm run typecheck`, `npm run lint`, `npm test`. For UI changes also `npm run e2e:build && npm run e2e`.

## Environment notes

- `npx expo install` needs the Expo API. If it is blocked, `EXPO_OFFLINE=1 npx expo install <pkg>` uses the SDK's bundled version list.
- Web is not a target platform; it is only used for browser tests and screenshots. Set `PW_CHANNEL=chrome` to run Playwright with an installed Chrome.
