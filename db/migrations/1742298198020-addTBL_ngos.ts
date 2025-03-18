import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTBLNgos1742298198020 implements MigrationInterface {
    name = 'AddTBLNgos1742298198020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ngos_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "ngos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "mission" character varying NOT NULL, "location" character varying NOT NULL, "contactEmail" character varying NOT NULL, "contactPhone" character varying NOT NULL, "status" "public"."ngos_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_0cc58d650c7475808e95b7d1c70" UNIQUE ("name"), CONSTRAINT "PK_f64f509c60499b255fd259a4973" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ngos" ADD CONSTRAINT "FK_368e52221e540f3596798844127" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ngos" DROP CONSTRAINT "FK_368e52221e540f3596798844127"`);
        await queryRunner.query(`DROP TABLE "ngos"`);
        await queryRunner.query(`DROP TYPE "public"."ngos_status_enum"`);
    }

}
