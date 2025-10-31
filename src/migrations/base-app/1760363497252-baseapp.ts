import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseapp1760363497252 implements MigrationInterface {
  name = 'Baseapp1760363497252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."plans_user_count_enum" AS ENUM('10', '20', 'Infinity')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_name" character varying(20) NOT NULL, "stripe_product_id" character varying(100), "user_count" "public"."plans_user_count_enum" NOT NULL, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stripe_session_id" character varying(100), "stripe_subscription_id" character varying(50), "stripe_customer_id" character varying(50), "status" boolean NOT NULL DEFAULT false, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "amount" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tenant_id" uuid, "plan_price_id" uuid, CONSTRAINT "PK_91a0ee8b462f23bfb2ad7924754" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_pricings_billing_cycle_enum" AS ENUM('monthly', 'quarterly', 'halfyearly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "plan_pricings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "billing_cycle" "public"."plan_pricings_billing_cycle_enum" NOT NULL, "price" integer NOT NULL, "stripe_price_id" character varying(100), "plan_id" uuid, CONSTRAINT "PK_27d7c146112678a013f2e861d38" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" boolean NOT NULL DEFAULT false, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "stripe_session_id" character varying(100), "stripe_subscription_id" character varying(50), "stripe_customer_id" character varying(50), "tenant_id" uuid, "plan_price_id" uuid, CONSTRAINT "REL_f6ac03431c311ccb8bbd7d3af1" UNIQUE ("tenant_id"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_name" character varying(30) NOT NULL, "user_name" character varying(30) NOT NULL, "password" character varying(100) NOT NULL, "url" text, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "domain" character varying(50) NOT NULL, "schema_name" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying(50), "city" character varying(40), "country" character varying(50), "otp" integer, "otp_expiry_at" TIMESTAMP, "email_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_4054367000c322223f0a12e3943" UNIQUE ("organization_name"), CONSTRAINT "UQ_155c343439adc83ada6ee3f48be" UNIQUE ("email"), CONSTRAINT "UQ_23d5a62128e1a248126c8453ff0" UNIQUE ("phone"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_e5ee62898352318b393e522dd99" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_history" ADD CONSTRAINT "FK_937f4433b4878ff14f5041be84b" FOREIGN KEY ("plan_price_id") REFERENCES "plan_pricings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_pricings" ADD CONSTRAINT "FK_38b3215bded9d7d33887189aa44" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_32070c53993605bd3699f9ec9a6" FOREIGN KEY ("plan_price_id") REFERENCES "plan_pricings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_32070c53993605bd3699f9ec9a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan_pricings" DROP CONSTRAINT "FK_38b3215bded9d7d33887189aa44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_937f4433b4878ff14f5041be84b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_history" DROP CONSTRAINT "FK_e5ee62898352318b393e522dd99"`,
    );
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plan_pricings"`);
    await queryRunner.query(`DROP TYPE "public"."plan_pricings_billing_cycle_enum"`);
    await queryRunner.query(`DROP TABLE "subscription_history"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TYPE "public"."plans_user_count_enum"`);
  }
}
