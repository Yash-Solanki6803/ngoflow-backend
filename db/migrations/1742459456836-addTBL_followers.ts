import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTBLFollowers1742459456836 implements MigrationInterface {
    name = 'AddTBLFollowers1742459456836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users_followed_ng_os_ngos" ("usersId" integer NOT NULL, "ngosId" uuid NOT NULL, CONSTRAINT "PK_9f92337907962c5940c6d5a4ebf" PRIMARY KEY ("usersId", "ngosId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d453d5bbb379ffbd67157a1a09" ON "users_followed_ng_os_ngos" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3e2ea8597bb993e7f5ac6cae67" ON "users_followed_ng_os_ngos" ("ngosId") `);
        await queryRunner.query(`ALTER TABLE "users_followed_ng_os_ngos" ADD CONSTRAINT "FK_d453d5bbb379ffbd67157a1a090" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_followed_ng_os_ngos" ADD CONSTRAINT "FK_3e2ea8597bb993e7f5ac6cae67d" FOREIGN KEY ("ngosId") REFERENCES "ngos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_followed_ng_os_ngos" DROP CONSTRAINT "FK_3e2ea8597bb993e7f5ac6cae67d"`);
        await queryRunner.query(`ALTER TABLE "users_followed_ng_os_ngos" DROP CONSTRAINT "FK_d453d5bbb379ffbd67157a1a090"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3e2ea8597bb993e7f5ac6cae67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d453d5bbb379ffbd67157a1a09"`);
        await queryRunner.query(`DROP TABLE "users_followed_ng_os_ngos"`);
    }

}
