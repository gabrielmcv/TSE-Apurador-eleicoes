CREATE TABLE `urn_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pleito` text NOT NULL,
	`uf` text NOT NULL,
	`municipio` text NOT NULL,
	`zona` text NOT NULL,
	`secao` text NOT NULL,
	`tse_hash` text NOT NULL,
	`filename` text NOT NULL,
	`type` text NOT NULL,
	`tse_received` text,
	`tse_status` text,
	`source` text NOT NULL,
	`object_key` text,
	`sha256` text,
	`size` integer,
	`received` text,
	`saved` text,
	`log_id` integer,
	`state` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urn_file_version` ON `urn_files` (`pleito`,`uf`,`municipio`,`zona`,`secao`,`tse_hash`,`filename`);--> statement-breakpoint
CREATE INDEX `urn_file_scope` ON `urn_files` (`uf`,`municipio`,`zona`,`secao`,`id`);--> statement-breakpoint
CREATE TABLE `urn_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_key` text NOT NULL,
	`kind` text NOT NULL,
	`uf` text NOT NULL,
	`source` text,
	`payload` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`next_ms` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urn_job_unique` ON `urn_jobs` (`job_key`);--> statement-breakpoint
CREATE INDEX `urn_job_queue` ON `urn_jobs` (`state`,`next_ms`);--> statement-breakpoint
CREATE TABLE `urn_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pleito` text NOT NULL,
	`uf` text NOT NULL,
	`municipio` text NOT NULL,
	`municipio_name` text NOT NULL,
	`zona` text NOT NULL,
	`secao` text NOT NULL,
	`principal` text,
	`aux_generated` text,
	`metadata` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urn_section_scope` ON `urn_sections` (`pleito`,`uf`,`municipio`,`zona`,`secao`);