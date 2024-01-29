CREATE OR REPLACE FUNCTION migration_up_001_category()
RETURNS void
LANGUAGE sql
AS
$$
CREATE TABLE "category" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"name" character varying NOT NULL,
	"keywords" text[] NOT NULL DEFAULT '{}',
	CONSTRAINT "PK_category" PRIMARY KEY ("id")
)
$$
VOLATILE
NOT LEAKPROOF
PARALLEL UNSAFE
