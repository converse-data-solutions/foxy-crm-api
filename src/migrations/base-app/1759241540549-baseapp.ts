import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseapp1759241540549 implements MigrationInterface {
  name = 'Baseapp1759241540549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_name" character varying(20) NOT NULL, "price" integer NOT NULL, "price_id" character varying(50) NOT NULL, "valid_upto" character varying(20) NOT NULL, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" boolean NOT NULL DEFAULT false, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "stripe_session_id" character varying(100), "stripe_subscription_id" character varying(50), "stripe_customer_id" character varying(50), "tenant_id" uuid, "subscription_id" uuid, CONSTRAINT "REL_f6ac03431c311ccb8bbd7d3af1" UNIQUE ("tenant_id"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_name" character varying(30) NOT NULL, "user_name" character varying(30) NOT NULL, "password" character varying(100) NOT NULL, "url" text, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "domain" character varying(50) NOT NULL, "schema_name" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying(50), "city" character varying(40), "country" character varying(50), "otp" integer, "otp_expiry_at" TIMESTAMP, "is_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_4054367000c322223f0a12e3943" UNIQUE ("organization_name"), CONSTRAINT "UQ_155c343439adc83ada6ee3f48be" UNIQUE ("email"), CONSTRAINT "UQ_23d5a62128e1a248126c8453ff0" UNIQUE ("phone"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_33b940ef52faaafc3d05f95719f" FOREIGN KEY ("subscription_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_33b940ef52faaafc3d05f95719f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18"`,
    );
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plans"`);
  }
}
