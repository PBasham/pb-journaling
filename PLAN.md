# PB Notes plan

**Current phase:** Milestone 3 (polish and launch prep)

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

## Milestone 3: polish and launch prep (not started)

- [ ] Test drag to reorder, biometrics, share sheet and file picker on a real Android phone
- [ ] App name, icon and splash (current name and icons are placeholders)
- [ ] Privacy policy and Play Store listing
- [ ] Owner checklist before publishing: contact email, developer name, package id
- [ ] Ideas: pin notes to the top of a collection, note templates, trash with 30 day restore

## Decisions log

- 2026-11-16: Rebuilt from the April 2024 Expo 49 prototype instead of upgrading in place. Same stack and patterns as Healthy Habits, no shared code.
- 2026-11-16: Flexible hierarchy. Pages are rows in `notes` with a `book_id`; a note is never in a collection and a book at once (database check).
- 2026-11-16: Deleting a collection asks whether to keep its contents (moved to the top level) or delete everything. Every delete offers Undo.
- 2026-11-16: Working name "PB Notes", package `com.pbasham.pbnotes`. Placeholder until a real name is picked.
- 2026-11-16: One PIN or password for everything. "Lock the app" is a toggle, so the secret can guard only chosen items. Items unlocked in a session lock again with the app (same relock timer). Removing the PIN or password unlocks every item, since nothing could open them otherwise.
- 2026-11-16: Locks hide content, they don't encrypt it on the device. Backups can be encrypted, and include locked items, so the passphrase option is on by default.
- 2026-11-16: Restore offers "Add to my library" (by id, nothing changed) or "Replace my library". Merging leaves settings alone.
- 2026-11-16: Drag to reorder is built on Gesture Handler 3 and Reanimated directly (no extra library). Arrow buttons stay for accessibility.
