CREATE TABLE `collection_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`uf` text NOT NULL,
	`cargo` text NOT NULL,
	`started` text NOT NULL,
	`received` text,
	`finished` text,
	`state` text NOT NULL,
	`http` integer,
	`latency` integer,
	`size` integer,
	`hash` text,
	`object_key` text,
	`snapshot_id` integer,
	`idg` text,
	`generated` text,
	`totalization` text,
	`request_headers` text NOT NULL,
	`response_headers` text,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `logs_scope` ON `collection_logs` (`uf`,`cargo`,`id`);