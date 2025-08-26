-- CreateEnum
CREATE TYPE "PreferredUnits" AS ENUM ('metric', 'imperial');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness', 'sport_specific', 'rehabilitation');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('front', 'side', 'back', 'other');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "phone" VARCHAR(20),
    "timezone" VARCHAR(50),
    "preferred_units" "PreferredUnits" NOT NULL DEFAULT 'metric',
    "profile_photo_url" VARCHAR(500),
    "cover_photo_url" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_measurements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "height" DECIMAL(5,2),
    "weight" DECIMAL(5,2),
    "body_fat_percentage" DECIMAL(4,2),
    "muscle_mass" DECIMAL(5,2),
    "measurements" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_health" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "blood_type" VARCHAR(10),
    "medical_conditions" TEXT[],
    "medications" TEXT[],
    "allergies" TEXT[],
    "injuries" JSONB,
    "surgeries" JSONB,
    "family_history" JSONB,
    "lifestyle" JSONB,
    "last_physical_exam" DATE,
    "emergency_contact" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "goal_type" "GoalType" NOT NULL,
    "specific_goal" TEXT,
    "target_value" DECIMAL(10,2),
    "target_date" DATE,
    "priority" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "achieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_certifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "certification_name" VARCHAR(255) NOT NULL,
    "issuing_organization" VARCHAR(255) NOT NULL,
    "credential_id" VARCHAR(100),
    "issue_date" DATE,
    "expiry_date" DATE,
    "document_url" VARCHAR(500),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_specializations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "specialization" VARCHAR(100) NOT NULL,
    "years_experience" INTEGER,
    "description" TEXT,

    CONSTRAINT "trainer_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "photo_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "photo_type" "PhotoType" NOT NULL,
    "notes" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "taken_at" TIMESTAMP(3),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_completion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "basic_info" BOOLEAN NOT NULL DEFAULT false,
    "profile_photo" BOOLEAN NOT NULL DEFAULT false,
    "health_info" BOOLEAN NOT NULL DEFAULT false,
    "goals_set" BOOLEAN NOT NULL DEFAULT false,
    "measurements" BOOLEAN NOT NULL DEFAULT false,
    "certifications" BOOLEAN NOT NULL DEFAULT false,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_health_user_id_key" ON "user_health"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_completion_user_id_key" ON "profile_completion"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_measurements" ADD CONSTRAINT "user_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_health" ADD CONSTRAINT "user_health_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_certifications" ADD CONSTRAINT "trainer_certifications_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_specializations" ADD CONSTRAINT "trainer_specializations_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_completion" ADD CONSTRAINT "profile_completion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
