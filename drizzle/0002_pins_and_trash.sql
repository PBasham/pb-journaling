ALTER TABLE `books` ADD `is_pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `collections` ADD `is_pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `notes` ADD `is_pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `deleted_at` integer;