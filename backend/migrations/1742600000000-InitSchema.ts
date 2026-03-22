import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1742600000000 implements MigrationInterface {
  name = 'InitSchema1742600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."expense_reports_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')
    `);
    await queryRunner.query(`
      CREATE TABLE "expense_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "public"."expense_reports_status_enum" NOT NULL DEFAULT 'DRAFT',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expense_reports" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."expense_items_category_enum" AS ENUM('TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORTATION', 'OFFICE_SUPPLIES', 'ENTERTAINMENT', 'UTILITIES', 'OTHER')
    `);
    await queryRunner.query(`
      CREATE TABLE "expense_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "category" "public"."expense_items_category_enum",
        "merchant_name" character varying(255),
        "transaction_date" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expense_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "expense_reports"
      ADD CONSTRAINT "FK_expense_reports_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "expense_items"
      ADD CONSTRAINT "FK_expense_items_report_id"
      FOREIGN KEY ("report_id") REFERENCES "expense_reports"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`CREATE INDEX "IDX_expense_reports_user_id" ON "expense_reports" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_expense_reports_status" ON "expense_reports" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_expense_items_report_id" ON "expense_items" ("report_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_expense_items_report_id"`);
    await queryRunner.query(`DROP INDEX "IDX_expense_reports_status"`);
    await queryRunner.query(`DROP INDEX "IDX_expense_reports_user_id"`);
    await queryRunner.query(`ALTER TABLE "expense_items" DROP CONSTRAINT "FK_expense_items_report_id"`);
    await queryRunner.query(`ALTER TABLE "expense_reports" DROP CONSTRAINT "FK_expense_reports_user_id"`);
    await queryRunner.query(`DROP TABLE "expense_items"`);
    await queryRunner.query(`DROP TYPE "public"."expense_items_category_enum"`);
    await queryRunner.query(`DROP TABLE "expense_reports"`);
    await queryRunner.query(`DROP TYPE "public"."expense_reports_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
