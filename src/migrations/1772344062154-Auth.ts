import { MigrationInterface, QueryRunner } from "typeorm";

export class Auth1772344062154 implements MigrationInterface {
    name = 'Auth1772344062154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "name" character varying(120) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e416cf6172bc5aec04244f6459" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b54f616411ef3824f6a5c06ea4" ON "auth" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b54f616411ef3824f6a5c06ea4"`);
        await queryRunner.query(`DROP TABLE "auth"`);
    }

}
