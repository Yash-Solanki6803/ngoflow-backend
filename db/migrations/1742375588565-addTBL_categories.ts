import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTBLCategories1742375588565 implements MigrationInterface {
    name = 'AddTBLCategories1742375588565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subcategories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "categoryId" integer, CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "campaigns_subcategories_subcategories" ("campaignsId" uuid NOT NULL, "subcategoriesId" integer NOT NULL, CONSTRAINT "PK_b419866b47bc0601a2aa9428d16" PRIMARY KEY ("campaignsId", "subcategoriesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc007349c43989cfe60d7984ea" ON "campaigns_subcategories_subcategories" ("campaignsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fae640b3cd8f1b430fb499c88" ON "campaigns_subcategories_subcategories" ("subcategoriesId") `);
        await queryRunner.query(`CREATE TABLE "users_interested_categories_categories" ("usersId" integer NOT NULL, "categoriesId" integer NOT NULL, CONSTRAINT "PK_7cde8d94bbe602b669144f3e033" PRIMARY KEY ("usersId", "categoriesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3e8e5122b131f58b2066dbbb32" ON "users_interested_categories_categories" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ecfe39ac2db2b571bf277819f" ON "users_interested_categories_categories" ("categoriesId") `);
        await queryRunner.query(`CREATE TABLE "users_interested_subcategories_subcategories" ("usersId" integer NOT NULL, "subcategoriesId" integer NOT NULL, CONSTRAINT "PK_36b4d0ea530c264c9b8024fd5b8" PRIMARY KEY ("usersId", "subcategoriesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e168457b6be75ef2f00132411b" ON "users_interested_subcategories_subcategories" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a90b4c15b64f01f620aac5847" ON "users_interested_subcategories_subcategories" ("subcategoriesId") `);
        await queryRunner.query(`ALTER TABLE "ngos" ADD "categoryId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastInterestUpdate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subcategories" ADD CONSTRAINT "FK_d1fe096726c3c5b8a500950e448" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ngos" ADD CONSTRAINT "FK_73f47d586377698f161d85f8390" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campaigns_subcategories_subcategories" ADD CONSTRAINT "FK_dc007349c43989cfe60d7984ea0" FOREIGN KEY ("campaignsId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "campaigns_subcategories_subcategories" ADD CONSTRAINT "FK_2fae640b3cd8f1b430fb499c882" FOREIGN KEY ("subcategoriesId") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_interested_categories_categories" ADD CONSTRAINT "FK_3e8e5122b131f58b2066dbbb32d" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_interested_categories_categories" ADD CONSTRAINT "FK_9ecfe39ac2db2b571bf277819fb" FOREIGN KEY ("categoriesId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_interested_subcategories_subcategories" ADD CONSTRAINT "FK_e168457b6be75ef2f00132411bc" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_interested_subcategories_subcategories" ADD CONSTRAINT "FK_1a90b4c15b64f01f620aac5847d" FOREIGN KEY ("subcategoriesId") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_interested_subcategories_subcategories" DROP CONSTRAINT "FK_1a90b4c15b64f01f620aac5847d"`);
        await queryRunner.query(`ALTER TABLE "users_interested_subcategories_subcategories" DROP CONSTRAINT "FK_e168457b6be75ef2f00132411bc"`);
        await queryRunner.query(`ALTER TABLE "users_interested_categories_categories" DROP CONSTRAINT "FK_9ecfe39ac2db2b571bf277819fb"`);
        await queryRunner.query(`ALTER TABLE "users_interested_categories_categories" DROP CONSTRAINT "FK_3e8e5122b131f58b2066dbbb32d"`);
        await queryRunner.query(`ALTER TABLE "campaigns_subcategories_subcategories" DROP CONSTRAINT "FK_2fae640b3cd8f1b430fb499c882"`);
        await queryRunner.query(`ALTER TABLE "campaigns_subcategories_subcategories" DROP CONSTRAINT "FK_dc007349c43989cfe60d7984ea0"`);
        await queryRunner.query(`ALTER TABLE "ngos" DROP CONSTRAINT "FK_73f47d586377698f161d85f8390"`);
        await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_d1fe096726c3c5b8a500950e448"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastInterestUpdate"`);
        await queryRunner.query(`ALTER TABLE "ngos" DROP COLUMN "categoryId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a90b4c15b64f01f620aac5847"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e168457b6be75ef2f00132411b"`);
        await queryRunner.query(`DROP TABLE "users_interested_subcategories_subcategories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ecfe39ac2db2b571bf277819f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3e8e5122b131f58b2066dbbb32"`);
        await queryRunner.query(`DROP TABLE "users_interested_categories_categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fae640b3cd8f1b430fb499c88"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc007349c43989cfe60d7984ea"`);
        await queryRunner.query(`DROP TABLE "campaigns_subcategories_subcategories"`);
        await queryRunner.query(`DROP TABLE "subcategories"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
