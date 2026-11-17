CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text,
	`name` text NOT NULL,
	`color` text DEFAULT 'slate' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `books_collection_idx` ON `books` (`collection_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'slate' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text,
	`book_id` text,
	`position` real DEFAULT 0 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content_json` text DEFAULT '{}' NOT NULL,
	`content_text` text DEFAULT '' NOT NULL,
	`color` text DEFAULT 'slate' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "notes_one_parent" CHECK("notes"."collection_id" is null or "notes"."book_id" is null)
);
--> statement-breakpoint
CREATE INDEX `notes_collection_idx` ON `notes` (`collection_id`);--> statement-breakpoint
CREATE INDEX `notes_book_idx` ON `notes` (`book_id`,`position`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
