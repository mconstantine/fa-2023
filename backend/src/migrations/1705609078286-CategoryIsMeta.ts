import { type MigrationInterface, type QueryRunner } from "typeorm"

export class CategoryIsMeta1705609078286 implements MigrationInterface {
  name = "CategoryIsMeta1705609078286"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD "isMeta" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "isMeta"`)
  }
}
