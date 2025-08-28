-- Performance optimization indexes for Exercise Library (Epic 004)
-- These indexes will significantly improve search and filtering performance

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_exercises_body_part ON exercises(body_part);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_target_muscle ON exercises(target_muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_exercises_bodypart_equipment ON exercises(body_part, equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_bodypart_difficulty ON exercises(body_part, difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_difficulty ON exercises(equipment, difficulty);

-- Full-text search index for exercise names and instructions
CREATE INDEX IF NOT EXISTS idx_exercises_name_search ON exercises USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_exercises_instructions_search ON exercises USING gin(to_tsvector('english', array_to_string(instructions, ' ')));

-- Performance index for favorites
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_user_created ON exercise_favorites(user_id, favorited_at DESC);

-- Performance index for usage tracking
CREATE INDEX IF NOT EXISTS idx_exercise_usage_user_date ON exercise_usage(user_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_usage_context ON exercise_usage(context, used_at DESC);

-- Search history optimization
CREATE INDEX IF NOT EXISTS idx_exercise_search_user_date ON exercise_search_history(user_id, searched_at DESC);

-- Collection performance
CREATE INDEX IF NOT EXISTS idx_collection_exercises_collection ON collection_exercises(collection_id, position);

-- Active exercises filter (most common query)
CREATE INDEX IF NOT EXISTS idx_exercises_active_name ON exercises(is_active, name) WHERE is_active = true;