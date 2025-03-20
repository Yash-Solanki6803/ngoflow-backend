import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTBLLikes1742465469934 implements MigrationInterface {
    name = 'UpdateTBLLikes1742465469934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users_liked_campaigns_campaigns" ("usersId" integer NOT NULL, "campaignsId" uuid NOT NULL, CONSTRAINT "PK_f5b56bd61ec5effb013ffb10af7" PRIMARY KEY ("usersId", "campaignsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb6d9eccd9ae27e13c55c8d05e" ON "users_liked_campaigns_campaigns" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf91b7a0292c6a692eca48caf4" ON "users_liked_campaigns_campaigns" ("campaignsId") `);
        await queryRunner.query(`ALTER TABLE "users_liked_campaigns_campaigns" ADD CONSTRAINT "FK_bb6d9eccd9ae27e13c55c8d05ef" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_liked_campaigns_campaigns" ADD CONSTRAINT "FK_bf91b7a0292c6a692eca48caf40" FOREIGN KEY ("campaignsId") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_liked_campaigns_campaigns" DROP CONSTRAINT "FK_bf91b7a0292c6a692eca48caf40"`);
        await queryRunner.query(`ALTER TABLE "users_liked_campaigns_campaigns" DROP CONSTRAINT "FK_bb6d9eccd9ae27e13c55c8d05ef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf91b7a0292c6a692eca48caf4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb6d9eccd9ae27e13c55c8d05e"`);
        await queryRunner.query(`DROP TABLE "users_liked_campaigns_campaigns"`);
    }

}
