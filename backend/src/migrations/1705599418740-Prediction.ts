import { type MigrationInterface, type QueryRunner } from "typeorm"

export class Prediction1705599418740 implements MigrationInterface {
  name = "Prediction1705599418740"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "prediction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid, "year" integer NOT NULL, "value" integer NOT NULL, CONSTRAINT "PK_23df2ceecea9f8bbb996ff056a3" PRIMARY KEY ("id"))`,
    )

    await queryRunner.query(
      `ALTER TABLE "prediction" ADD CONSTRAINT "FK_83e8c7ad6b1f02f59c2c04e0bc2" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prediction" DROP CONSTRAINT "FK_83e8c7ad6b1f02f59c2c04e0bc2"`,
    )

    await queryRunner.query(`DROP TABLE "prediction"`)
  }
}
