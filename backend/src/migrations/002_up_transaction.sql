CREATE OR REPLACE FUNCTION migration_up_002_transaction()
RETURNS void
LANGUAGE sql
AS
$$
CREATE TABLE "transaction" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid(),
	"description" character varying NOT NULL,
	"value" integer NOT NULL,
	"date" date NOT NULL,
	"categoryId" uuid,
	CONSTRAINT "PK_transaction" PRIMARY KEY ("id")
);

ALTER TABLE "transaction"
ADD CONSTRAINT "FK_transaction_category" FOREIGN KEY ("categoryId") REFERENCES "category" ("id")
ON DELETE SET NULL ON UPDATE NO ACTION;
$$
VOLATILE
NOT LEAKPROOF
PARALLEL UNSAFE
