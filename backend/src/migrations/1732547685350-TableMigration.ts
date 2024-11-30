import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTablesSchema20241125000000 implements MigrationInterface {
    name = 'UpdateTablesSchema20241125000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create or update tables
        await queryRunner.query(`
            DO $$
            BEGIN
                -- Users table
                IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
                    CREATE TABLE "users" (
                        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                        "email" varchar NOT NULL UNIQUE,
                        "firstName" varchar NOT NULL,
                        "lastName" varchar NOT NULL,
                        "passwordHash" varchar NOT NULL,
                        "verificationToken" varchar,
                        "verificationStatus" verification_status_enum NOT NULL DEFAULT 'pending',
                        "role" varchar NOT NULL DEFAULT 'user'
                    );
                END IF;

                -- Horses table
                IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'horses') THEN
                    CREATE TABLE "horses" (
                        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                        "basicInfo" jsonb NOT NULL,
                        "media" jsonb NOT NULL,
                        "performance" jsonb NOT NULL,
                        "health" jsonb NOT NULL,
                        "lineage" jsonb NOT NULL,
                        "ownerId" uuid NOT NULL,
                        "status" varchar NOT NULL DEFAULT 'active',
                        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                        CONSTRAINT "fk_horses_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id")
                    );
                END IF;

                -- Horse views table
                IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'horse_views') THEN
                    CREATE TABLE "horse_views" (
                        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                        "horseId" uuid NOT NULL,
                        "userId" uuid NOT NULL,
                        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                        CONSTRAINT "fk_horse_views_horse" FOREIGN KEY ("horseId") REFERENCES "horses"("id"),
                        CONSTRAINT "fk_horse_views_user" FOREIGN KEY ("userId") REFERENCES "users"("id")
                    );
                END IF;

                -- Deals table
                IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals') THEN
                    CREATE TABLE "deals" (
                        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                        "type" deal_type_enum NOT NULL,
                        "stage" deal_stage_enum NOT NULL DEFAULT 'Initiation',
                        "status" deal_status_enum NOT NULL DEFAULT 'Active',
                        "basicInfo" jsonb NOT NULL,
                        "terms" jsonb NOT NULL,
                        "participants" jsonb NOT NULL,
                        "documents" jsonb NOT NULL,
                        "logistics" jsonb,
                        "timeline" jsonb NOT NULL,
                        "stageRequirements" jsonb,
                        "validationResults" jsonb,
                        "horseId" uuid NOT NULL,
                        "createdById" uuid NOT NULL,
                        "metadata" jsonb,
                        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                        CONSTRAINT "fk_deals_horse" FOREIGN KEY ("horseId") REFERENCES "horses"("id"),
                        CONSTRAINT "fk_deals_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id"),
                        CONSTRAINT "chk_deal_stage_status" CHECK (("stage" = 'Complete' AND "status" = 'Completed') OR "stage" != 'Complete')
                    );
                END IF;
            END $$;
        `);

        // Create indexes if they don't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_horses_owner') THEN
                    CREATE INDEX "idx_horses_owner" ON "horses"("ownerId");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_horses_status') THEN
                    CREATE INDEX "idx_horses_status" ON "horses"("status");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deals_type') THEN
                    CREATE INDEX "idx_deals_type" ON "deals"("type");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deals_stage') THEN
                    CREATE INDEX "idx_deals_stage" ON "deals"("stage");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deals_status') THEN
                    CREATE INDEX "idx_deals_status" ON "deals"("status");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deals_horse') THEN
                    CREATE INDEX "idx_deals_horse" ON "deals"("horseId");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deals_created_by') THEN
                    CREATE INDEX "idx_deals_created_by" ON "deals"("createdById");
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No destructive operations in down migration
        await queryRunner.query(`SELECT 1;`);
    }
}