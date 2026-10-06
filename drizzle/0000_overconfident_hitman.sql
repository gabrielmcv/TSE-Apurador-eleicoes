CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`uf` text NOT NULL,
	`cargo` text NOT NULL,
	`idg` text NOT NULL,
	`generation_ms` integer NOT NULL,
	`generated` text NOT NULL,
	`totalization` text NOT NULL,
	`received` text NOT NULL,
	`saved` text NOT NULL,
	`hash` text NOT NULL,
	`object_key` text NOT NULL,
	`normalized` text NOT NULL,
	`etag` text,
	`modified` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `snapshot_identity` ON `snapshots` (`source`,`idg`,`hash`);--> statement-breakpoint
CREATE INDEX `snapshot_scope` ON `snapshots` (`uf`,`cargo`,`id`);--> statement-breakpoint
CREATE TABLE `source_state` (
	`source` text PRIMARY KEY NOT NULL,
	`next_ms` integer NOT NULL,
	`lease` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`error` text,
	`checked` text,
	`http` integer,
	`latency` integer
);
