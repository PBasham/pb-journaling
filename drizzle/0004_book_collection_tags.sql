CREATE TABLE `book_tags` (
	`book_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`book_id`, `tag_id`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `book_tags_tag_idx` ON `book_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `collection_tags` (
	`collection_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`collection_id`, `tag_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_tags_tag_idx` ON `collection_tags` (`tag_id`);