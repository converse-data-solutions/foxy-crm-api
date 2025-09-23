import { MigrationInterface, QueryRunner } from 'typeorm';

export class Coreapp1758548121691 implements MigrationInterface {
  name = 'Coreapp1758548121691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema: string = (queryRunner.connection.options as any).schema || 'public';
    await queryRunner.query(`SET search_path TO "${schema}",public`);
    await queryRunner.query(
      `CREATE TABLE "countries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "iso_code_2" character(2) NOT NULL, "iso_code_3" character(3) NOT NULL, "phone_code" character varying(10) NOT NULL, "flag_image" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_fa1376321185575cf2226b1491d" UNIQUE ("name"), CONSTRAINT "UQ_ce2d339f2b3b971f340cd16db0d" UNIQUE ("iso_code_2"), CONSTRAINT "UQ_838e05dd9fe2ea2b3f5e97814be" UNIQUE ("iso_code_3"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "leads_status_enum" AS ENUM('new', 'qualified', 'disqualified', 'in progress', 'converted')`,
    );
    await queryRunner.query(
      `CREATE TYPE "leads_source_enum" AS ENUM('website', 'refferral', 'social media', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "status" "leads_status_enum" NOT NULL DEFAULT 'new', "phone" character varying(20) NOT NULL, "company" character varying(100), "source" "leads_source_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_to" uuid, "contact_id" uuid, "created_by" uuid, "converted_by" uuid, CONSTRAINT "UQ_b3eea7add0e16594dba102716c5" UNIQUE ("email"), CONSTRAINT "UQ_42ebb4366d014febbcfdef39e36" UNIQUE ("phone"), CONSTRAINT "REL_517db338cbbdc2dcffd8dea4c9" UNIQUE ("contact_id"), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM('admin', 'manager', 'salesrep')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "password" character varying(100) NOT NULL, "role" "users_role_enum" NOT NULL DEFAULT 'salesrep', "address" character varying(50), "city" character varying(40), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "country_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(40) NOT NULL, "industry" character varying(40) NOT NULL, "website" text NOT NULL, "address" character varying(50), "city" character varying(40), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "country_id" uuid, "created_by" uuid, CONSTRAINT "UQ_2db43cdbf7bb862e577b5f540c8" UNIQUE ("name"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "account_id" uuid, "assigned_to" uuid, "created_by" uuid, CONSTRAINT "UQ_752866c5247ddd34fd05559537d" UNIQUE ("email"), CONSTRAINT "UQ_84cae51c485079bdd8cdf1d828f" UNIQUE ("phone"), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "contact_id" uuid, "createdById" uuid, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "tickets_status_enum" AS ENUM('open', 'in progress', 'resolved', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(30) NOT NULL, "description" character varying(300) NOT NULL, "status" "tickets_status_enum" NOT NULL DEFAULT 'open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP, "contact_id" uuid, "assigned_to" uuid, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "tasks_entity_name_enum" AS ENUM('deal', 'ticket')`);
    await queryRunner.query(`CREATE TYPE "tasks_type_enum" AS ENUM('call', 'email', 'meeting')`);
    await queryRunner.query(
      `CREATE TYPE "tasks_status_enum" AS ENUM('pending', 'completed', 'overdue')`,
    );
    await queryRunner.query(`CREATE TYPE "tasks_priority_enum" AS ENUM('low', 'medium', 'high')`);
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_name" "tasks_entity_name_enum" NOT NULL, "entity_id" character varying(40) NOT NULL, "type" "tasks_type_enum" NOT NULL, "status" "tasks_status_enum" NOT NULL DEFAULT 'pending', "priority" "tasks_priority_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_to" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "deals_stage_enum" AS ENUM('qualified', 'proposal', 'negotiation', 'accepted', 'declined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "value" integer NOT NULL, "stage" "deals_stage_enum" NOT NULL DEFAULT 'qualified', "expected_close_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "contact_id" uuid, "created_by" uuid, CONSTRAINT "CHK_5383e3356384f18293f261ad23" CHECK ("expected_close_date" > CURRENT_DATE), CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_5c37aa54e3b06f6733d56007e0c" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_517db338cbbdc2dcffd8dea4c99" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_c99cd25033cfe84de5cdf790754" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_a670b7e5463d2717e02110646a7" FOREIGN KEY ("converted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_ae78dc6cb10aa14cfef96b2dd90" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_7a4a927a81e1e372ab4f56d0731" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_6ce484b7743042752cdecc41c99" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_85bbf0f254d76347a346a8cbb15" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_d90dcb0992cd86fbbb744f8f8a6" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_06dcbcd88c5647753f0f0a4f1cc" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_a8301a5912b0226297e36cadf6e" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_f2a1f6264b833a0b7db37757952" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_38b2f9803395427e46eb3467312" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_47c3fba35bfcbb08e3445f57d6e" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_5770b28d72ca90c43b1381bf787" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_a96c558d0ebee23c264dbe726fb" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema: string = (queryRunner.connection.options as any).schema || 'public';
    await queryRunner.query(`SET search_path TO "${schema}",public`);
    await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_a96c558d0ebee23c264dbe726fb"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_5770b28d72ca90c43b1381bf787"`);
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_47c3fba35bfcbb08e3445f57d6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_38b2f9803395427e46eb3467312"`,
    );
    await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_f2a1f6264b833a0b7db37757952"`);
    await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_a8301a5912b0226297e36cadf6e"`);
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_06dcbcd88c5647753f0f0a4f1cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_d90dcb0992cd86fbbb744f8f8a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_85bbf0f254d76347a346a8cbb15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_6ce484b7743042752cdecc41c99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_7a4a927a81e1e372ab4f56d0731"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_ae78dc6cb10aa14cfef96b2dd90"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_a670b7e5463d2717e02110646a7"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_c99cd25033cfe84de5cdf790754"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_517db338cbbdc2dcffd8dea4c99"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_5c37aa54e3b06f6733d56007e0c"`);
    await queryRunner.query(`DROP TABLE "deals"`);
    await queryRunner.query(`DROP TYPE "deals_stage_enum"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_type_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_entity_name_enum"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "tickets_status_enum"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TYPE "leads_source_enum"`);
    await queryRunner.query(`DROP TYPE "leads_status_enum"`);
    await queryRunner.query(`DROP TABLE "countries"`);
  }
}
