import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseapp1758188517192 implements MigrationInterface {
    name = 'Baseapp1758188517192'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "countries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "iso_code_2" character(2) NOT NULL, "iso_code_3" character(3) NOT NULL, "phone_code" character varying(10) NOT NULL, "flag_image" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_fa1376321185575cf2226b1491d" UNIQUE ("name"), CONSTRAINT "UQ_ce2d339f2b3b971f340cd16db0d" UNIQUE ("iso_code_2"), CONSTRAINT "UQ_838e05dd9fe2ea2b3f5e97814be" UNIQUE ("iso_code_3"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_name" character varying(20) NOT NULL, "price" integer NOT NULL, "user_count" integer NOT NULL, "valid_upto" integer NOT NULL, CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant_subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" boolean NOT NULL DEFAULT false, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "tenant_id" uuid, "subscription_id" uuid, CONSTRAINT "REL_a300c9bff7b5bb7cd6d3ed00e7" UNIQUE ("tenant_id"), CONSTRAINT "PK_d91b66c187ed664d890944a9776" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_name" character varying(30) NOT NULL, "user_name" character varying(30) NOT NULL, "password" character varying(100) NOT NULL, "url" text, "email" character varying(40) NOT NULL, "phone" character varying(20) NOT NULL, "domain" character varying(50) NOT NULL, "schema_name" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "country_id" uuid, CONSTRAINT "UQ_f64fb293bb7c25068688849d4be" UNIQUE ("organization_name"), CONSTRAINT "UQ_5b5d9635409048b7144f5f23198" UNIQUE ("email"), CONSTRAINT "UQ_a1a1c76cff0abe272369359aefb" UNIQUE ("phone"), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tenant_subscription" ADD CONSTRAINT "FK_a300c9bff7b5bb7cd6d3ed00e7a" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_subscription" ADD CONSTRAINT "FK_b331008b58bd61e9d7ac93a0058" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant" ADD CONSTRAINT "FK_4221fb2582a6aa08715b6161ffd" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant" DROP CONSTRAINT "FK_4221fb2582a6aa08715b6161ffd"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscription" DROP CONSTRAINT "FK_b331008b58bd61e9d7ac93a0058"`);
        await queryRunner.query(`ALTER TABLE "tenant_subscription" DROP CONSTRAINT "FK_a300c9bff7b5bb7cd6d3ed00e7a"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "tenant_subscription"`);
        await queryRunner.query(`DROP TABLE "subscription"`);
        await queryRunner.query(`DROP TABLE "countries"`);
    }

}
