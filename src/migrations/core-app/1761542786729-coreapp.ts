import { MigrationInterface, QueryRunner } from 'typeorm';

export class Coreapp1761542786729 implements MigrationInterface {
  name = 'Coreapp1761542786729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema: string = (queryRunner.connection.options as any).schema || 'public';
    await queryRunner.query(`SET search_path TO "${schema}",public`);
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(40) NOT NULL, "industry" character varying(40) NOT NULL, "website" text NOT NULL, "address" character varying(50), "city" character varying(40), "country" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "UQ_2db43cdbf7bb862e577b5f540c8" UNIQUE ("name"), CONSTRAINT "UQ_54613c31faeda08540b3524b7c8" UNIQUE ("website"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "account_id" uuid, "assigned_to" uuid, "created_by" uuid, "updated_by" uuid, CONSTRAINT "UQ_752866c5247ddd34fd05559537d" UNIQUE ("email"), CONSTRAINT "UQ_84cae51c485079bdd8cdf1d828f" UNIQUE ("phone"), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "lead_activities_activity_type_enum" AS ENUM('email_sent', 'call_made', 'meeting_scheduled', 'meeting_attended', 'status_changed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lead_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activity_type" "lead_activities_activity_type_enum" NOT NULL, "activity_date" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "lead_id" uuid, "created_by" uuid, CONSTRAINT "PK_1aa1cc6988a817368568ca26bf1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "leads_status_enum" AS ENUM('new', 'qualified', 'disqualified', 'in progress', 'converted')`,
    );
    await queryRunner.query(
      `CREATE TYPE "leads_source_enum" AS ENUM('website', 'referral', 'social media', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "status" "leads_status_enum" NOT NULL DEFAULT 'new', "phone" character varying(20) NOT NULL, "company" character varying(100), "source" "leads_source_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_to" uuid, "contact_id" uuid, "created_by" uuid, "converted_by" uuid, CONSTRAINT "UQ_b3eea7add0e16594dba102716c5" UNIQUE ("email"), CONSTRAINT "UQ_42ebb4366d014febbcfdef39e36" UNIQUE ("phone"), CONSTRAINT "REL_517db338cbbdc2dcffd8dea4c9" UNIQUE ("contact_id"), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM('super admin','admin', 'manager', 'salesrep', 'support', 'technical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_status_cause_enum" AS ENUM('plan limit', 'admin disabled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "email" character varying(50) NOT NULL, "phone" character varying(20) NOT NULL, "password" character varying(100) NOT NULL, "role" "users_role_enum" NOT NULL DEFAULT 'salesrep', "address" character varying(50), "city" character varying(40), "country" character varying(50), "status" boolean NOT NULL DEFAULT true, "status_cause" "users_status_cause_enum", "otp" character varying(100), "otp_expiry_at" TIMESTAMP, "email_verified" boolean NOT NULL DEFAULT false, "otp_verified" boolean NOT NULL DEFAULT false, "refreshToken" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "deals_stage_enum" AS ENUM('qualified', 'proposal', 'negotiation', 'accepted', 'declined', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(30) NOT NULL, "value" numeric(8,2) NOT NULL, "stage" "deals_stage_enum" NOT NULL DEFAULT 'qualified', "expected_close_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "contact_id" uuid, "created_by" uuid, CONSTRAINT "UQ_e1f47ea0ff1173d9faab2023488" UNIQUE ("name"), CONSTRAINT "CHK_8033fda435366469b2ebec364e" CHECK ("expected_close_date" IS NULL OR "expected_close_date" > CURRENT_DATE), CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "tickets_status_enum" AS ENUM('open', 'in progress', 'resolved', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(30) NOT NULL, "description" character varying(300) NOT NULL, "status" "tickets_status_enum" NOT NULL DEFAULT 'open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP, "contact_id" uuid, "deal_id" uuid, "created_by" uuid, "updated_by" uuid, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "notes_entity_name_enum" AS ENUM('lead', 'contact')`);
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "entity_name" "notes_entity_name_enum" NOT NULL, "entity_id" character varying(40) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "tasks_entity_name_enum" AS ENUM('deals', 'tickets')`);
    await queryRunner.query(
      `CREATE TYPE "tasks_type_enum" AS ENUM('call', 'email', 'meeting', 'fixes', 'develop', 'design')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tasks_status_enum" AS ENUM('pending', 'completed', 'in progress')`,
    );
    await queryRunner.query(`CREATE TYPE "tasks_priority_enum" AS ENUM('low', 'medium', 'high')`);
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "entity_name" "tasks_entity_name_enum" NOT NULL, "entity_id" character varying(40) NOT NULL, "type" "tasks_type_enum" NOT NULL, "status" "tasks_status_enum" NOT NULL DEFAULT 'pending', "priority" "tasks_priority_enum" NOT NULL DEFAULT 'medium', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "assigned_to" uuid, "created_by" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_c8067d2dc7bc8408ec3cc4a9e25" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_26316cb0e146683e9e8aee237d4" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" ADD CONSTRAINT "FK_1339a9192b94ddf0eac8f25142b" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD CONSTRAINT "FK_a96c558d0ebee23c264dbe726fb" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_38b2f9803395427e46eb3467312" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_76eb157f105e7628f17446b76b0" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_8798a589dc4c71b6d0e8c2b9fc3" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_11e329dba935d03d626939e78ec" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_b86c5f2b5de1e7a3d2a428cfb55" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_5770b28d72ca90c43b1381bf787" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema: string = (queryRunner.connection.options as any).schema || 'public';
    await queryRunner.query(`SET search_path TO "${schema}",public`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_5770b28d72ca90c43b1381bf787"`);
    await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_b86c5f2b5de1e7a3d2a428cfb55"`);
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_11e329dba935d03d626939e78ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_8798a589dc4c71b6d0e8c2b9fc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_76eb157f105e7628f17446b76b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_38b2f9803395427e46eb3467312"`,
    );
    await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_a96c558d0ebee23c264dbe726fb"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_a670b7e5463d2717e02110646a7"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_c99cd25033cfe84de5cdf790754"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_517db338cbbdc2dcffd8dea4c99"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_5c37aa54e3b06f6733d56007e0c"`);
    await queryRunner.query(
      `ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_1339a9192b94ddf0eac8f25142b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lead_activities" DROP CONSTRAINT "FK_26316cb0e146683e9e8aee237d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_c8067d2dc7bc8408ec3cc4a9e25"`,
    );
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
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_type_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_entity_name_enum"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TYPE "notes_entity_name_enum"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "tickets_status_enum"`);
    await queryRunner.query(`DROP TABLE "deals"`);
    await queryRunner.query(`DROP TYPE "deals_stage_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_status_cause_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TYPE "leads_source_enum"`);
    await queryRunner.query(`DROP TYPE "leads_status_enum"`);
    await queryRunner.query(`DROP TABLE "lead_activities"`);
    await queryRunner.query(`DROP TYPE "lead_activities_activity_type_enum"`);
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}
