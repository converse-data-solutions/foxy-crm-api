import { MigrationInterface, QueryRunner } from 'typeorm';

export class Coreapp1758188533909 implements MigrationInterface {
  name = 'Coreapp1758188533909';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema || 'public';
    await queryRunner.query(`SET search_path TO "${schema}",public`);
    await queryRunner.query(
      `CREATE TABLE "countries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "iso_code_2" character(2) NOT NULL, "iso_code_3" character(3) NOT NULL, "phone_code" character varying(10) NOT NULL, "flag_image" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_fa1376321185575cf2226b1491d" UNIQUE ("name"), CONSTRAINT "UQ_ce2d339f2b3b971f340cd16db0d" UNIQUE ("iso_code_2"), CONSTRAINT "UQ_838e05dd9fe2ea2b3f5e97814be" UNIQUE ("iso_code_3"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "industry" character varying(20) NOT NULL, "website" text NOT NULL, "address" character varying(50), "city" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "country_id" uuid, CONSTRAINT "UQ_414d4052f22837655ff312168cb" UNIQUE ("name"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "note" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "contact_id" uuid, "createdById" uuid, CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "account_id" uuid, CONSTRAINT "UQ_eff09bb429f175523787f46003b" UNIQUE ("email"), CONSTRAINT "UQ_f9f62556c7092913f2a06975052" UNIQUE ("phone"), CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "lead_status_enum" AS ENUM('new', 'qualified', 'disqualified', 'in progress', 'converted')`,
    );
    await queryRunner.query(
      `CREATE TYPE "lead_source_enum" AS ENUM('website', 'refferral', 'social media', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lead" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "status" "lead_status_enum" NOT NULL DEFAULT 'new', "phone" character varying(20) NOT NULL, "company" character varying(100), "source" "lead_source_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_to" uuid, "contact_id" uuid, "created_by" uuid, CONSTRAINT "UQ_82927bc307d97fe09c616cd3f58" UNIQUE ("email"), CONSTRAINT "UQ_dc3c65c297bc24457653569e136" UNIQUE ("phone"), CONSTRAINT "REL_0bd59c5be16d19ab0f92614922" UNIQUE ("contact_id"), CONSTRAINT "PK_ca96c1888f7dcfccab72b72fffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('admin', 'manager', 'salesrep')`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "password" character varying(100) NOT NULL, "role" "user_role_enum" NOT NULL DEFAULT 'salesrep', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "country_id" uuid, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "opportunity_stage_enum" AS ENUM('qualified', 'proposal', 'negotiation', 'accepted', 'declined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "opportunity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "value" integer NOT NULL, "stage" "opportunity_stage_enum" NOT NULL DEFAULT 'qualified', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "contact_id" uuid, CONSTRAINT "PK_085fd6d6f4765325e6c16163568" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "task_entity_name_enum" AS ENUM('opportunity', 'ticket')`);
    await queryRunner.query(`CREATE TYPE "task_type_enum" AS ENUM('call', 'email', 'meeting')`);
    await queryRunner.query(
      `CREATE TYPE "task_status_enum" AS ENUM('pending', 'completed', 'overdue')`,
    );
    await queryRunner.query(`CREATE TYPE "task_priority_enum" AS ENUM('low', 'medium', 'high')`);
    await queryRunner.query(
      `CREATE TABLE "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_name" "task_entity_name_enum" NOT NULL, "entity_id" character varying(40) NOT NULL, "type" "task_type_enum" NOT NULL, "status" "task_status_enum" NOT NULL DEFAULT 'pending', "priority" "task_priority_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_to" uuid, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "ticket_status_enum" AS ENUM('open', 'in progress', 'resolved', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(30) NOT NULL, "description" character varying(300) NOT NULL, "status" "ticket_status_enum" NOT NULL DEFAULT 'open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP, "contact_id" uuid, "assigned_to" uuid, CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_7b3797290fa30fe5c83dc4235a5" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_8c8246c4097ef5db45debdc42a7" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_1100c955b41aeaca61ddd9308d4" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_6b3555c0d3d0f0d0b6887b5308b" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead" ADD CONSTRAINT "FK_99fb94b07cc6e8a299a74ac20b5" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead" ADD CONSTRAINT "FK_0bd59c5be16d19ab0f926149228" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead" ADD CONSTRAINT "FK_8179f2d0de9be1af9d575bb04b1" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_b89cdc0829042ce01f20140eced" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "opportunity" ADD CONSTRAINT "FK_6fcd5898b644cfa3840badb7ea9" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_9eae030e5c6bb7da4c61b9ff404" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_a3ce544688c161cbfa75e04d8c0" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_036b5f20f93359a0dfe0058facd" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema || 'public';
    await queryRunner.query(`SET search_path TO "${schema}",public`);
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_036b5f20f93359a0dfe0058facd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_a3ce544688c161cbfa75e04d8c0"`,
    );
    await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_9eae030e5c6bb7da4c61b9ff404"`);
    await queryRunner.query(
      `ALTER TABLE "opportunity" DROP CONSTRAINT "FK_6fcd5898b644cfa3840badb7ea9"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_b89cdc0829042ce01f20140eced"`);
    await queryRunner.query(`ALTER TABLE "lead" DROP CONSTRAINT "FK_8179f2d0de9be1af9d575bb04b1"`);
    await queryRunner.query(`ALTER TABLE "lead" DROP CONSTRAINT "FK_0bd59c5be16d19ab0f926149228"`);
    await queryRunner.query(`ALTER TABLE "lead" DROP CONSTRAINT "FK_99fb94b07cc6e8a299a74ac20b5"`);
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "FK_6b3555c0d3d0f0d0b6887b5308b"`,
    );
    await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_1100c955b41aeaca61ddd9308d4"`);
    await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_8c8246c4097ef5db45debdc42a7"`);
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_7b3797290fa30fe5c83dc4235a5"`,
    );
    await queryRunner.query(`DROP TABLE "ticket"`);
    await queryRunner.query(`DROP TYPE "ticket_status_enum"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TYPE "task_priority_enum"`);
    await queryRunner.query(`DROP TYPE "task_status_enum"`);
    await queryRunner.query(`DROP TYPE "task_type_enum"`);
    await queryRunner.query(`DROP TYPE "task_entity_name_enum"`);
    await queryRunner.query(`DROP TABLE "opportunity"`);
    await queryRunner.query(`DROP TYPE "opportunity_stage_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TABLE "lead"`);
    await queryRunner.query(`DROP TYPE "lead_source_enum"`);
    await queryRunner.query(`DROP TYPE "lead_status_enum"`);
    await queryRunner.query(`DROP TABLE "contact"`);
    await queryRunner.query(`DROP TABLE "note"`);
    await queryRunner.query(`DROP TABLE "account"`);
    await queryRunner.query(`DROP TABLE "countries"`);
  }
}
