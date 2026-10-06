CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uf` text NOT NULL,
	`cargo` text NOT NULL,
	`log_id` integer NOT NULL,
	`snapshot_id` integer NOT NULL,
	`previous_id` integer,
	`event_key` text NOT NULL,
	`kind` text NOT NULL,
	`candidate` text,
	`name` text NOT NULL,
	`before_votes` integer,
	`after_votes` integer,
	`delta` integer,
	`received` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `audit_observation` ON `audit_events` (`log_id`,`event_key`);--> statement-breakpoint
CREATE INDEX `audit_scope` ON `audit_events` (`uf`,`cargo`,`id`);--> statement-breakpoint
CREATE INDEX `audit_candidate` ON `audit_events` (`uf`,`cargo`,`candidate`,`id`);