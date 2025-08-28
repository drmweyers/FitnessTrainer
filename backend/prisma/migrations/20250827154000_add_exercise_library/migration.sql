-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "DifficultyLevel" AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exercise_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "gif_url" VARCHAR(500) NOT NULL,
    "body_part" VARCHAR(100) NOT NULL,
    "equipment" VARCHAR(100) NOT NULL,
    "target_muscle" VARCHAR(100) NOT NULL,
    "secondary_muscles" TEXT[],
    "instructions" TEXT[],
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'intermediate',
    "search_vector" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_favorites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "favorited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "exercise_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_exercises" (
    "collection_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "position" INTEGER,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_exercises_pkey" PRIMARY KEY ("collection_id","exercise_id")
);

-- CreateTable
CREATE TABLE "exercise_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "context" VARCHAR(50) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_search_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "search_query" VARCHAR(255) NOT NULL,
    "filters" JSONB,
    "result_count" INTEGER,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_exercise_id_key" ON "exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_favorites_user_id_exercise_id_key" ON "exercise_favorites"("user_id", "exercise_id");

-- CreateIndex
CREATE INDEX "exercises_body_part_idx" ON "exercises"("body_part");

-- CreateIndex
CREATE INDEX "exercises_equipment_idx" ON "exercises"("equipment");

-- CreateIndex
CREATE INDEX "exercises_target_muscle_idx" ON "exercises"("target_muscle");

-- CreateIndex
CREATE INDEX "exercises_name_idx" ON "exercises"("name");

-- CreateIndex
CREATE INDEX "exercises_is_active_idx" ON "exercises"("is_active");

-- AddForeignKey
ALTER TABLE "exercise_favorites" ADD CONSTRAINT "exercise_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_favorites" ADD CONSTRAINT "exercise_favorites_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_collections" ADD CONSTRAINT "exercise_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_exercises" ADD CONSTRAINT "collection_exercises_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "exercise_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_exercises" ADD CONSTRAINT "collection_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_usage" ADD CONSTRAINT "exercise_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_usage" ADD CONSTRAINT "exercise_usage_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_search_history" ADD CONSTRAINT "exercise_search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;