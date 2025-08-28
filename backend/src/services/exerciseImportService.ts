import { PrismaClient, DifficultyLevel } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Types based on the exerciseDB JSON structure
interface ExerciseData {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

interface BodyPart {
  name: string;
}

interface Equipment {
  name: string;
}

interface Muscle {
  name: string;
}

export class ExerciseImportService {
  private readonly exerciseDbPath: string;

  constructor() {
    // Path to the exercise database JSON files
    this.exerciseDbPath = path.join(
      process.cwd(), 
      '..', 
      'exerciseDB', 
      'ExerciseDB JSON', 
      'exercisedb', 
      'exercisedb'
    );
  }

  /**
   * Import all exercise data from JSON files into the database
   */
  async importAllExerciseData(): Promise<{
    exercises: number;
    errors: string[];
  }> {
    console.log('Starting exercise data import...');
    let importedCount = 0;
    const errors: string[] = [];

    try {
      // Read and parse exercise data
      const exercises = await this.loadExercisesData();
      console.log(`Found ${exercises.length} exercises to import`);

      // Import exercises in batches for better performance
      const batchSize = 50;
      for (let i = 0; i < exercises.length; i += batchSize) {
        const batch = exercises.slice(i, i + batchSize);
        
        try {
          await this.importExerciseBatch(batch);
          importedCount += batch.length;
          console.log(`Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(exercises.length / batchSize)} (${importedCount}/${exercises.length})`);
        } catch (error) {
          const errorMsg = `Failed to import batch starting at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Exercise import completed. Imported: ${importedCount}, Errors: ${errors.length}`);
      return { exercises: importedCount, errors };

    } catch (error) {
      const errorMsg = `Failed to import exercise data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { exercises: importedCount, errors };
    }
  }

  /**
   * Load exercise data from JSON file
   */
  private async loadExercisesData(): Promise<ExerciseData[]> {
    const exercisesPath = path.join(this.exerciseDbPath, 'exercises.json');
    
    try {
      const data = await fs.readFile(exercisesPath, 'utf8');
      const exercises: ExerciseData[] = JSON.parse(data);
      
      // Validate the data structure
      if (!Array.isArray(exercises)) {
        throw new Error('Exercise data is not an array');
      }

      return exercises;
    } catch (error) {
      throw new Error(`Failed to load exercises data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import a batch of exercises
   */
  private async importExerciseBatch(exercises: ExerciseData[]): Promise<void> {
    const exerciseData = exercises.map(exercise => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyParts[0] || 'unknown', // Take first body part
      equipment: exercise.equipments[0] || 'body weight', // Take first equipment
      targetMuscle: exercise.targetMuscles[0] || 'unknown', // Take first target muscle
      secondaryMuscles: exercise.secondaryMuscles || [],
      instructions: exercise.instructions || [],
      difficulty: this.determineDifficulty(exercise),
      searchVector: this.generateSearchVector(exercise),
      isActive: true,
    }));

    // Use upsert to handle potential duplicates
    await Promise.all(
      exerciseData.map(data =>
        prisma.exercise.upsert({
          where: { exerciseId: data.exerciseId },
          update: {
            name: data.name,
            gifUrl: data.gifUrl,
            bodyPart: data.bodyPart,
            equipment: data.equipment,
            targetMuscle: data.targetMuscle,
            secondaryMuscles: data.secondaryMuscles,
            instructions: data.instructions,
            difficulty: data.difficulty,
            searchVector: data.searchVector,
            isActive: data.isActive,
          },
          create: data,
        })
      )
    );
  }

  /**
   * Determine exercise difficulty based on various factors
   */
  private determineDifficulty(exercise: ExerciseData): DifficultyLevel {
    const name = exercise.name.toLowerCase();
    const equipment = exercise.equipments[0]?.toLowerCase() || '';
    
    // Beginner exercises
    if (
      name.includes('beginner') ||
      name.includes('basic') ||
      equipment === 'body weight' ||
      name.includes('assisted') ||
      name.includes('machine') ||
      name.includes('supported')
    ) {
      return DifficultyLevel.beginner;
    }
    
    // Advanced exercises
    if (
      name.includes('advanced') ||
      name.includes('explosive') ||
      name.includes('plyo') ||
      name.includes('jump') ||
      name.includes('one arm') ||
      name.includes('single arm') ||
      name.includes('pistol') ||
      name.includes('handstand') ||
      name.includes('muscle up') ||
      equipment.includes('olympic') ||
      equipment.includes('trap bar')
    ) {
      return DifficultyLevel.advanced;
    }
    
    // Default to intermediate
    return DifficultyLevel.intermediate;
  }

  /**
   * Generate search vector for full-text search
   */
  private generateSearchVector(exercise: ExerciseData): string {
    const searchTerms = [
      exercise.name,
      ...exercise.bodyParts,
      ...exercise.equipments,
      ...exercise.targetMuscles,
      ...exercise.secondaryMuscles,
      ...exercise.instructions
    ];
    
    return searchTerms
      .filter(term => term && typeof term === 'string')
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Load reference data (body parts, equipment, muscles) - for future use
   */
  async loadReferenceData(): Promise<{
    bodyParts: BodyPart[];
    equipment: Equipment[];
    muscles: Muscle[];
  }> {
    const [bodyParts, equipment, muscles] = await Promise.all([
      this.loadJsonFile<BodyPart[]>('bodyParts.json'),
      this.loadJsonFile<Equipment[]>('equipments.json'),
      this.loadJsonFile<Muscle[]>('muscles.json'),
    ]);

    return { bodyParts, equipment, muscles };
  }

  /**
   * Helper method to load and parse JSON files
   */
  private async loadJsonFile<T>(filename: string): Promise<T> {
    const filePath = path.join(this.exerciseDbPath, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Check if exercise data has already been imported
   */
  async isDataImported(): Promise<boolean> {
    const count = await prisma.exercise.count();
    return count > 0;
  }

  /**
   * Clear all exercise data (use with caution)
   */
  async clearExerciseData(): Promise<number> {
    console.log('Clearing all exercise data...');
    
    // Delete in order to respect foreign key constraints
    await prisma.exerciseUsage.deleteMany();
    await prisma.collectionExercise.deleteMany();
    await prisma.exerciseFavorite.deleteMany();
    const { count } = await prisma.exercise.deleteMany();
    
    console.log(`Cleared ${count} exercises and related data`);
    return count;
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalExercises: number;
    byBodyPart: Record<string, number>;
    byEquipment: Record<string, number>;
    byDifficulty: Record<string, number>;
  }> {
    const [
      totalExercises,
      bodyPartStats,
      equipmentStats,
      difficultyStats
    ] = await Promise.all([
      prisma.exercise.count(),
      prisma.exercise.groupBy({
        by: ['bodyPart'],
        _count: { bodyPart: true },
      }),
      prisma.exercise.groupBy({
        by: ['equipment'],
        _count: { equipment: true },
      }),
      prisma.exercise.groupBy({
        by: ['difficulty'],
        _count: { difficulty: true },
      }),
    ]);

    return {
      totalExercises,
      byBodyPart: Object.fromEntries(
        bodyPartStats.map(stat => [stat.bodyPart, stat._count.bodyPart])
      ),
      byEquipment: Object.fromEntries(
        equipmentStats.map(stat => [stat.equipment, stat._count.equipment])
      ),
      byDifficulty: Object.fromEntries(
        difficultyStats.map(stat => [stat.difficulty, stat._count.difficulty])
      ),
    };
  }
}

export default new ExerciseImportService();