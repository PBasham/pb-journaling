# PB Notes plan

**Current phase:** Milestone 3 (polish and launch prep), waiting on phone testing and the name

A local-first note taking app organized like a shelf: **Collections** hold **Books** and loose **Notes**; Books hold ordered **Pages**. Books and notes can also live at the top level. Android first (Google Play).

## Milestone 1: core library and editor

- [x] Rebuild on Expo 58, Expo Router, SQLite + Drizzle, plain StyleSheet theme (light and dark)
- [x] Collections: create, rename, recolor, favorite, delete (keep contents or delete everything), undo
- [x] Books: create, rename, recolor, favorite, move between collections and top level, delete with undo
- [x] Pages: add, reorder, move out of a book, delete with undo
- [x] Notes: create, move into a collection or book, color, favorite, delete with undo
- [x] Rich text editor (TenTap) with autosave; blank new notes are removed on leaving
- [x] Sort collections, books and notes by updated, created or name (remembered)
- [x] Favorites row on the library screen
- [x] Unit tests (data layer) and browser tests (main flows)

## Milestone 2: search, locks, backup, theming

- [x] Tabs: Library, Search, Settings
- [x] Appearance: System, Light or Dark, plus seven accent colors (same approach as Healthy Habits)
- [x] Settings: appearance, note previews on/off, locks, backup & restore
- [x] Search across collection and book names, note titles and note text, with snippets
- [x] Locks: one PIN or password (salted PBKDF2 hash in secure storage), optional fingerprint or face unlock
- [x] Lock the whole app on open (optional), with relock timing and a privacy cover in the app switcher
- [x] Lock individual collections, books and notes; locking a collection or book locks what's inside
- [x] Locked items: hidden from search, previews hidden in lists, options hidden until opened
- [x] Backup: export to a file through the share sheet, optionally encrypted (AES-256-GCM)
- [x] Restore: add missing items to the library, or replace the library (confirmed)
- [x] Export as Markdown (locked items by name only)
- [x] Reorder pages by dragging, with arrow buttons as an accessible alternative
- [x] Tests for search, locks, reordering, backup format, restore and Markdown

## Milestone 3: polish and launch prep

- [x] Formatting toolbar: Title, Heading, Subheading, bulleted and numbered lists, checklists, quote, indent and outdent, bold, italic, underline, strikethrough, inline code, highlight, links, undo and redo
- [x] Markdown shortcuts while typing (`# `, `## `, `- `, `1. `, `[ ] `)
- [x] Pin collections, books and notes to the top of their lists
- [x] Recently deleted: deletes are kept 30 days, with restore, delete for good and empty
- [x] Own icon, adaptive icon and splash (bookshelf), replacing the Healthy Habits placeholders
- [x] Privacy policy draft (`docs/privacy-policy.md`) and Play Store listing draft (`docs/store-listing.md`)
- [x] Example library: a button on the empty Library adds Recipes, Work, a trip book, tags, a favorite and a pin
- [x] Developer tools (development build only): counts, example library, 1,000 page test data, old deleted notes, clean up, remove lock, erase
- [x] Share a note as Markdown text, duplicate notes, pages and whole books, note info (words, reading time, dates, where)
- [x] Continue writing: the notes opened last, at the top of the Library
- [x] Custom editor page (`editor-web/`) with code blocks and dividers
- [x] Templates: five built in (Recipe, Meeting notes, Daily log, Checklist, Book notes), save any note as one, offered on new notes
- [x] Tags on notes and pages, tag chips under the title, search by tag, manage in Settings (rename merges)
- [x] Photos in notes: camera or gallery, private shrunk copies, full screen viewer, included in backups (zip)
- [ ] Test drag to reorder, biometrics, share sheet, file picker, camera and photos on a real Android phone
- [ ] Pick the app name (then update `app.json`, the listing and the policy)
- [ ] Owner checklist before publishing: contact email (privacy policy), developer name, package id
- [ ] Ideas: tags on books and collections, photos inline in the text, home screen widget

## Decisions log

- 2026-11-16: Rebuilt from the April 2024 Expo 49 prototype instead of upgrading in place. Same stack and patterns as Healthy Habits, no shared code.
- 2026-11-16: Flexible hierarchy. Pages are rows in `notes` with a `book_id`; a note is never in a collection and a book at once (database check).
- 2026-11-16: Deleting a collection asks whether to keep its contents (moved to the top level) or delete everything. Every delete offers Undo.
- 2026-11-16: Working name "PB Notes", package `com.pbasham.pbnotes`. Placeholder until a real name is picked.
- 2026-11-16: One PIN or password for everything. "Lock the app" is a toggle, so the secret can guard only chosen items. Items unlocked in a session lock again with the app (same relock timer). Removing the PIN or password unlocks every item, since nothing could open them otherwise.
- 2026-11-16: Locks hide content, they don't encrypt it on the device. Backups can be encrypted, and include locked items, so the passphrase option is on by default.
- 2026-11-16: Restore offers "Add to my library" (by id, nothing changed) or "Replace my library". Merging leaves settings alone.
- 2026-11-16: Drag to reorder is built on Gesture Handler 3 and Reanimated directly (no extra library). Arrow buttons stay for accessibility.
- 2026-11-16: Deleting moves items to Recently deleted (a `deleted_at` time) instead of removing rows. Things deleted together share the time, so they restore together. Undo restores from there. A blank note made by mistake skips it.
- 2026-11-16: The editor keeps TenTap's built in editor page, with our own toolbar. Code blocks and dividers would need a custom editor build (like Healthy Habits' `editor-web/`), so they wait.
- 2026-11-16: Highlight color is one see-through yellow saved in the note, so it reads in light and dark.
- 2026-11-16: The editor is now our own page (`editor-web/`, like Healthy Habits) so it can have code blocks and dividers. Rebuild it with `npm run editor:build`.
- 2026-11-16: Tags are on notes and pages only for now; search filters by them. Restoring a backup by adding joins tags that share a name.
- 2026-11-16: Photos sit in a strip on the note (not inline in the text) and are files in app storage. Copies of a note share files; unused files are removed at startup. Backups with photos are a zip; encrypted backups encrypt the photos too.
- 2026-11-16: Developer tools only show in the development build or a dev server session.
