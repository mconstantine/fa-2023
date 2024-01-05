import { type MigrationInterface, type QueryRunner } from "typeorm"

export class ManyTransactionsToManyCategories1704494309901
  implements MigrationInterface
{
  name = "ManyTransactionsToManyCategories1704494309901"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_d3951864751c5812e70d033978d"`,
    )

    await queryRunner.query(
      `CREATE TABLE "transaction_categories_category" ("transactionId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_0d8a5d83b9b2fa5fd69e2f49e2a" PRIMARY KEY ("transactionId", "categoryId"))`,
    )

    await queryRunner.query(
      `CREATE INDEX "IDX_f122af6428c36e90cc79141e52" ON "transaction_categories_category" ("transactionId") `,
    )

    await queryRunner.query(
      `CREATE INDEX "IDX_3d308518c7d704c7ed5dd6c153" ON "transaction_categories_category" ("categoryId") `,
    )

    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "categoryId"`,
    )

    await queryRunner.query(
      `ALTER TABLE "transaction_categories_category" ADD CONSTRAINT "FK_f122af6428c36e90cc79141e523" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )

    await queryRunner.query(
      `ALTER TABLE "transaction_categories_category" ADD CONSTRAINT "FK_3d308518c7d704c7ed5dd6c1538" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_categories_category" DROP CONSTRAINT "FK_3d308518c7d704c7ed5dd6c1538"`,
    )

    await queryRunner.query(
      `ALTER TABLE "transaction_categories_category" DROP CONSTRAINT "FK_f122af6428c36e90cc79141e523"`,
    )

    await queryRunner.query(`ALTER TABLE "transaction" ADD "categoryId" uuid`)

    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d308518c7d704c7ed5dd6c153"`,
    )

    await queryRunner.query(
      `DROP INDEX "public"."IDX_f122af6428c36e90cc79141e52"`,
    )

    await queryRunner.query(`DROP TABLE "transaction_categories_category"`)

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_d3951864751c5812e70d033978d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
  }
}
