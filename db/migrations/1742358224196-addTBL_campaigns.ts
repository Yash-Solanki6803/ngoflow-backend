import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTBLCampaigns1742358224196 implements MigrationInterface {
    name = 'AddTBLCampaigns1742358224196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ngoId" uuid, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "campaigns_volunteers_users" ("campaignsId" uuid NOT NULL, "usersId" integer NOT NULL, CONSTRAINT "PK_c141a66f79e5ad6d02ab35470d0" PRIMARY KEY ("campaignsId", "usersId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aa2e74c97255805f09d0a8dd64" ON "campaigns_volunteers_users" ("campaignsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64ffea7137cf8f8e74224b7101" ON "campaigns_volunteers_users" ("usersId") `);
        await queryRunner.query(`ALTER TABLE "campaigns" ADD CONSTRAINT "FK_1aa5893e4c6d8765399b0f55581" FOREIGN KEY ("ngoId") REFERENCES "ngos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campaigns_volunteers_users" ADD CONSTRAINT "FK_aa2e74c97255805f09d0a8dd643" FOREIGN KEY ("campaignsId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "campaigns_volunteers_users" ADD CONSTRAINT "FK_64ffea7137cf8f8e74224b71013" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "campaigns_volunteers_users" DROP CONSTRAINT "FK_64ffea7137cf8f8e74224b71013"`);
        await queryRunner.query(`ALTER TABLE "campaigns_volunteers_users" DROP CONSTRAINT "FK_aa2e74c97255805f09d0a8dd643"`);
        await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT "FK_1aa5893e4c6d8765399b0f55581"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64ffea7137cf8f8e74224b7101"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa2e74c97255805f09d0a8dd64"`);
        await queryRunner.query(`DROP TABLE "campaigns_volunteers_users"`);
        await queryRunner.query(`DROP TABLE "campaigns"`);
    }

}
