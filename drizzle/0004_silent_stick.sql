CREATE TABLE `result_jobs` (
	`source` text PRIMARY KEY NOT NULL,
	`uf` text NOT NULL,
	`cargo` text NOT NULL,
	`next_ms` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`checked` text,
	`http` integer,
	`error` text,
	`snapshot_id` integer
);
--> statement-breakpoint
CREATE INDEX `result_job_queue` ON `result_jobs` (`next_ms`,`lease_until`);