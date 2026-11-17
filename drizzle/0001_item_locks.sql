ALTER TABLE `books` ADD `is_locked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `is_locked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `is_locked` integer DEFAULT false NOT NULL;