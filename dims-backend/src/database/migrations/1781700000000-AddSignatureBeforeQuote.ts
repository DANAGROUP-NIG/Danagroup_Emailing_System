import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSignatureBeforeQuote1781700000000 implements MigrationInterface {
    name = 'AddSignatureBeforeQuote1781700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signature_before_quote" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "signature_before_quote"`);
    }
}
