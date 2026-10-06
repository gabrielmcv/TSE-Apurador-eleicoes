CREATE TABLE `municipal_jobs` (
	`ibge` text PRIMARY KEY NOT NULL,
	`uf` text NOT NULL,
	`municipio` text NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL,
	`next_ms` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`checked` text,
	`http` integer,
	`error` text,
	`snapshot_id` integer,
	`summary` text
);
--> statement-breakpoint
CREATE INDEX `municipal_job_queue` ON `municipal_jobs` (`next_ms`,`lease_until`);--> statement-breakpoint
CREATE UNIQUE INDEX `municipal_scope` ON `municipal_jobs` (`uf`,`municipio`);--> statement-breakpoint
CREATE TABLE `municipal_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ibge` text NOT NULL,
	`uf` text NOT NULL,
	`municipio` text NOT NULL,
	`source` text NOT NULL,
	`idg` text NOT NULL,
	`generation_ms` integer NOT NULL,
	`generated` text NOT NULL,
	`received` text NOT NULL,
	`saved` text NOT NULL,
	`hash` text NOT NULL,
	`object_key` text NOT NULL,
	`normalized` text NOT NULL,
	`etag` text,
	`modified` text,
	`log_id` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `municipal_version` ON `municipal_snapshots` (`ibge`,`idg`,`hash`);--> statement-breakpoint
CREATE INDEX `municipal_history` ON `municipal_snapshots` (`ibge`,`generation_ms`,`id`);