# PB Notes plan

**Current phase:** Milestone 1 (core library and editor)

A local-first note taking app organized like a shelf: **Collections** hold **Books** and loose **Notes**; Books hold ordered **Pages**. Books and notes can also live at the top level. Android first (Google Play).

## Milestone 1: core library and editor

- [x] Rebuild on Expo 58, Expo Router, SQLite + Drizzle, plain StyleSheet theme (light and dark)
- [x] Collections: create, rename, recolor, favorite, delete (keep contents or delete everything), undo
- [x] Books: create, rename, recolor, favorite, move between collections and top level, delete with undo
- [x] Pages: add, reorder (move up / down), move out of a book, delete with undo
- [x] Notes: create, move into a collection or book, color, favorite, delete with undo
- [x] Rich text editor (TenTap) with autosave; blank new notes are removed on leaving
- [x] Sort collections, books and notes by updated, created or name (remembered)
- [x] Favorites row on the library screen
- [x] Unit tests (data layer) and browser tests (main flows)

## Milestone 2 ideas (not started)

- [ ] Search across titles and text
- [ ] Locks: PIN, password and biometrics per item (secrets as salted hashes in secure storage)
- [ ] Backup: export and import a file
- [ ] Drag to reorder pages
- [ ] App name, icon and store listing (current name and icons are placeholders)

## Decisions log

- 2026-11-16: Rebuilt from the April 2024 Expo 49 prototype instead of upgrading in place. Same stack and patterns as Healthy Habits, no shared code.
- 2026-11-16: Flexible hierarchy. Pages are rows in `notes` with a `book_id`; a note is never in a collection and a book at once (database check).
- 2026-11-16: Deleting a collection asks whether to keep its contents (moved to the top level) or delete everything. Every delete offers Undo.
- 2026-11-16: Working name "PB Notes", package `com.pbasham.pbnotes`. Placeholder until a real name is picked.
