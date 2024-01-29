CREATE OR REPLACE FUNCTION migration_down_002_transaction()
RETURNS void
LANGUAGE sql
AS
$$
ALTER TABLE "transaction" DROP CONSTRAINT "FK_transaction_category";
DROP TABLE "transaction";
$$
VOLATILE
NOT LEAKPROOF
PARALLEL UNSAFE
