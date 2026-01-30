import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/TestHelpers';
import { ExerciseTestHelpers, ExerciseTestData } from './utils/ExerciseTestHelpers';

test.describe('Exercise Library API Tests (Epic 004)', () => {
  let trainerCredentials: { email: string; password: string };
  let authHeaders: { Authorization: string };
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create test trainer account and get auth headers
    try {
      trainerCredentials = await TestHelpers.createTestTrainer(page);
    } catch (error) {
      trainerCredentials = {
        email: 'trainer@evofit-qa.com',
        password: 'TestPassword123!'
      };
    }
    
    // Login to get auth token
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: trainerCredentials.email,
        password: trainerCredentials.password
      }
    });
    
    if (loginResponse.ok()) {
      const { accessToken } = await loginResponse.json();
      authHeaders = { Authorization: `Bearer ${accessToken}` };
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Setup authentication for each test
    await TestHelpers.loginAsTrainer(page, trainerCredentials);
    
    // Ensure we start with clean state
    await ExerciseTestHelpers.cleanupExerciseTestData(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    await ExerciseTestHelpers.cleanupExerciseTestData(page);
  });

  test.describe('Exercise CRUD Operations', () => {
    test('API-001: should get all exercises with pagination', async ({ page }) => {
      const response = await page.request.get('/api/exercises', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(Array.isArray(data.exercises)).toBe(true);
      
      // Verify exercise structure
      if (data.exercises.length > 0) {
        const exercise = data.exercises[0];
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('gifUrl');
        expect(exercise).toHaveProperty('targetMuscles');
        expect(exercise).toHaveProperty('bodyParts');
        expect(exercise).toHaveProperty('equipments');
      }
    });

    test('API-002: should get exercise by ID', async ({ page }) => {
      // First get all exercises to get a valid ID
      const allExercisesResponse = await page.request.get('/api/exercises?limit=1', {
        headers: authHeaders
      });
      
      expect(allExercisesResponse.status()).toBe(200);
      const allData = await allExercisesResponse.json();
      
      if (allData.exercises.length > 0) {
        const exerciseId = allData.exercises[0].id;
        
        const response = await page.request.get(`/api/exercises/${exerciseId}`, {
          headers: authHeaders
        });
        
        expect(response.status()).toBe(200);
        
        const exercise = await response.json();
        expect(exercise.id).toBe(exerciseId);
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('instructions');
        expect(Array.isArray(exercise.instructions)).toBe(true);
      }
    });

    test('API-003: should handle non-existent exercise ID', async ({ page }) => {
      const response = await page.request.get('/api/exercises/non-existent-id', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
    });

    test('API-004: should require authentication for exercise endpoints', async ({ page }) => {
      // Test without auth headers
      const response = await page.request.get('/api/exercises');
      
      expect(response.status()).toBe(401);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error.toLowerCase()).toContain('unauthorized');
    });
  });

  test.describe('Exercise Search API', () => {
    test('API-005: should search exercises by name', async ({ page }) => {
      const response = await page.request.get('/api/exercises/search?q=push', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      expect(data).toHaveProperty('total');
      
      // Verify search results contain the query term
      if (data.exercises.length > 0) {
        const exercise = data.exercises[0];
        const nameContainsQuery = exercise.name.toLowerCase().includes('push');
        const instructionsContainQuery = exercise.instructions?.some((instruction: string) => 
          instruction.toLowerCase().includes('push')
        );
        
        expect(nameContainsQuery || instructionsContainQuery).toBe(true);
      }
    });

    test('API-006: should handle empty search results', async ({ page }) => {
      const response = await page.request.get('/api/exercises/search?q=nonexistentexercise12345', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.exercises).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    test('API-007: should search with special characters', async ({ page }) => {
      const searchTerms = ['push-up', 'sit&stand', '3/4 sit'];
      
      for (const term of searchTerms) {
        const response = await page.request.get(`/api/exercises/search?q=${encodeURIComponent(term)}`, {
          headers: authHeaders
        });
        
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data).toHaveProperty('exercises');
        expect(data).toHaveProperty('total');
      }
    });

    test('API-008: should limit search results', async ({ page }) => {
      const response = await page.request.get('/api/exercises/search?q=push&limit=5', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.exercises.length).toBeLessThanOrEqual(5);
    });

    test('API-009: should measure search response time', async ({ page }) => {
      const startTime = Date.now();
      
      const response = await page.request.get('/api/exercises/search?q=bench', {
        headers: authHeaders
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(500); // Under 500ms as per Epic requirements
      
      console.log(`Search response time: ${responseTime}ms`);
    });
  });

  test.describe('Exercise Filtering API', () => {
    test('API-010: should filter by body part', async ({ page }) => {
      const response = await page.request.get('/api/exercises?bodyPart=chest', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      
      // Verify all returned exercises have chest as body part
      if (data.exercises.length > 0) {
        for (const exercise of data.exercises.slice(0, 5)) { // Check first 5
          expect(exercise.bodyParts).toContain('chest');
        }
      }
    });

    test('API-011: should filter by equipment', async ({ page }) => {
      const response = await page.request.get('/api/exercises?equipment=barbell', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      
      // Verify all returned exercises use barbell
      if (data.exercises.length > 0) {
        for (const exercise of data.exercises.slice(0, 5)) { // Check first 5
          expect(exercise.equipments).toContain('barbell');
        }
      }
    });

    test('API-012: should filter by target muscle', async ({ page }) => {
      const response = await page.request.get('/api/exercises?targetMuscle=pectorals', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      
      // Verify all returned exercises target pectorals
      if (data.exercises.length > 0) {
        for (const exercise of data.exercises.slice(0, 5)) { // Check first 5
          expect(exercise.targetMuscles).toContain('pectorals');
        }
      }
    });

    test('API-013: should handle multiple filter combinations', async ({ page }) => {
      const response = await page.request.get('/api/exercises?bodyPart=chest&equipment=barbell&targetMuscle=pectorals', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      
      // Verify exercises match all criteria
      if (data.exercises.length > 0) {
        for (const exercise of data.exercises.slice(0, 3)) { // Check first 3
          expect(exercise.bodyParts).toContain('chest');
          expect(exercise.equipments).toContain('barbell');
          expect(exercise.targetMuscles).toContain('pectorals');
        }
      }
    });

    test('API-014: should return empty results for invalid filters', async ({ page }) => {
      const response = await page.request.get('/api/exercises?bodyPart=nonexistent', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.exercises).toHaveLength(0);
      expect(data.total).toBe(0);
    });
  });

  test.describe('Exercise Categories API', () => {
    test('API-015: should get all body parts', async ({ page }) => {
      const response = await page.request.get('/api/exercises/categories/bodyparts', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const bodyParts = await response.json();
      expect(Array.isArray(bodyParts)).toBe(true);
      expect(bodyParts.length).toBeGreaterThan(0);
      
      // Should include common body parts
      const bodyPartNames = bodyParts.map(bp => bp.name || bp);
      expect(bodyPartNames).toContain('chest');
      expect(bodyPartNames).toContain('back');
    });

    test('API-016: should get all equipment types', async ({ page }) => {
      const response = await page.request.get('/api/exercises/categories/equipments', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const equipments = await response.json();
      expect(Array.isArray(equipments)).toBe(true);
      expect(equipments.length).toBeGreaterThan(0);
      
      // Should include common equipment
      const equipmentNames = equipments.map(eq => eq.name || eq);
      expect(equipmentNames).toContain('barbell');
      expect(equipmentNames).toContain('body weight');
    });

    test('API-017: should get all muscle groups', async ({ page }) => {
      const response = await page.request.get('/api/exercises/categories/muscles', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const muscles = await response.json();
      expect(Array.isArray(muscles)).toBe(true);
      expect(muscles.length).toBeGreaterThan(0);
      
      // Should include common muscles
      const muscleNames = muscles.map(m => m.name || m);
      expect(muscleNames).toContain('pectorals');
      expect(muscleNames).toContain('biceps');
    });
  });

  test.describe('Exercise Favorites API', () => {
    test('API-018: should add exercise to favorites', async ({ page }) => {
      // Get an exercise ID first
      const exercisesResponse = await page.request.get('/api/exercises?limit=1', {
        headers: authHeaders
      });
      
      expect(exercisesResponse.status()).toBe(200);
      const exerciseData = await exercisesResponse.json();
      
      if (exerciseData.exercises.length > 0) {
        const exerciseId = exerciseData.exercises[0].id;
        
        const response = await page.request.post(`/api/exercises/${exerciseId}/favorite`, {
          headers: authHeaders
        });
        
        expect(response.status()).toBe(200);
        
        const result = await response.json();
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
      }
    });

    test('API-019: should remove exercise from favorites', async ({ page }) => {
      // Get an exercise ID and favorite it first
      const exercisesResponse = await page.request.get('/api/exercises?limit=1', {
        headers: authHeaders
      });
      
      const exerciseData = await exercisesResponse.json();
      
      if (exerciseData.exercises.length > 0) {
        const exerciseId = exerciseData.exercises[0].id;
        
        // Add to favorites
        await page.request.post(`/api/exercises/${exerciseId}/favorite`, {
          headers: authHeaders
        });
        
        // Remove from favorites
        const response = await page.request.delete(`/api/exercises/${exerciseId}/favorite`, {
          headers: authHeaders
        });
        
        expect(response.status()).toBe(200);
        
        const result = await response.json();
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
      }
    });

    test('API-020: should get user favorites', async ({ page }) => {
      const response = await page.request.get('/api/exercises/favorites', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const favorites = await response.json();
      expect(Array.isArray(favorites)).toBe(true);
      
      // Each favorite should have exercise information
      for (const favorite of favorites.slice(0, 3)) {
        expect(favorite).toHaveProperty('exercise');
        expect(favorite.exercise).toHaveProperty('id');
        expect(favorite.exercise).toHaveProperty('name');
      }
    });

    test('API-021: should handle duplicate favorite requests', async ({ page }) => {
      const exercisesResponse = await page.request.get('/api/exercises?limit=1', {
        headers: authHeaders
      });
      
      const exerciseData = await exercisesResponse.json();
      
      if (exerciseData.exercises.length > 0) {
        const exerciseId = exerciseData.exercises[0].id;
        
        // Add to favorites first time
        const firstResponse = await page.request.post(`/api/exercises/${exerciseId}/favorite`, {
          headers: authHeaders
        });
        expect(firstResponse.status()).toBe(200);
        
        // Add to favorites second time (should handle gracefully)
        const secondResponse = await page.request.post(`/api/exercises/${exerciseId}/favorite`, {
          headers: authHeaders
        });
        
        // Should either return 200 (idempotent) or 409 (conflict)
        expect([200, 409]).toContain(secondResponse.status());
      }
    });
  });

  test.describe('Exercise Collections API', () => {
    test('API-022: should create exercise collection', async ({ page }) => {
      const collectionData = {
        name: 'Test Upper Body Collection',
        description: 'Collection for upper body exercises',
        isPublic: false
      };
      
      const response = await page.request.post('/api/exercises/collections', {
        headers: authHeaders,
        data: collectionData
      });
      
      expect(response.status()).toBe(201);
      
      const collection = await response.json();
      expect(collection).toHaveProperty('id');
      expect(collection.name).toBe(collectionData.name);
      expect(collection.description).toBe(collectionData.description);
    });

    test('API-023: should get user collections', async ({ page }) => {
      const response = await page.request.get('/api/exercises/collections', {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const collections = await response.json();
      expect(Array.isArray(collections)).toBe(true);
      
      // Each collection should have required properties
      for (const collection of collections.slice(0, 3)) {
        expect(collection).toHaveProperty('id');
        expect(collection).toHaveProperty('name');
        expect(collection).toHaveProperty('exercises');
      }
    });

    test('API-024: should add exercise to collection', async ({ page }) => {
      // Create a collection first
      const collectionId = await ExerciseTestHelpers.createTestCollection(
        page, 
        'Test Collection for API'
      );
      
      // Get an exercise ID
      const exercisesResponse = await page.request.get('/api/exercises?limit=1', {
        headers: authHeaders
      });
      
      const exerciseData = await exercisesResponse.json();
      
      if (exerciseData.exercises.length > 0) {
        const exerciseId = exerciseData.exercises[0].id;
        
        const response = await page.request.post(`/api/exercises/collections/${collectionId}/exercises`, {
          headers: authHeaders,
          data: { exerciseId }
        });
        
        expect(response.status()).toBe(200);
        
        const result = await response.json();
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
      }
    });

    test('API-025: should remove exercise from collection', async ({ page }) => {
      // Create collection and add exercise
      const collectionId = await ExerciseTestHelpers.createTestCollection(page, 'Test Removal Collection');
      
      const exercisesResponse = await page.request.get('/api/exercises?limit=1', {
        headers: authHeaders
      });
      
      const exerciseData = await exercisesResponse.json();
      
      if (exerciseData.exercises.length > 0) {
        const exerciseId = exerciseData.exercises[0].id;
        
        // Add exercise to collection
        await page.request.post(`/api/exercises/collections/${collectionId}/exercises`, {
          headers: authHeaders,
          data: { exerciseId }
        });
        
        // Remove exercise from collection
        const response = await page.request.delete(`/api/exercises/collections/${collectionId}/exercises/${exerciseId}`, {
          headers: authHeaders
        });
        
        expect(response.status()).toBe(200);
        
        const result = await response.json();
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
      }
    });

    test('API-026: should delete collection', async ({ page }) => {
      // Create a collection first
      const collectionId = await ExerciseTestHelpers.createTestCollection(page, 'Collection to Delete');
      
      const response = await page.request.delete(`/api/exercises/collections/${collectionId}`, {
        headers: authHeaders
      });
      
      expect(response.status()).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      // Verify collection is deleted
      const getResponse = await page.request.get(`/api/exercises/collections/${collectionId}`, {
        headers: authHeaders
      });
      expect(getResponse.status()).toBe(404);
    });

    test('API-027: should handle collection access permissions', async ({ page }) => {
      // Try to access another user's private collection (if such test data exists)
      const response = await page.request.get('/api/exercises/collections/non-existent-or-private-id', {
        headers: authHeaders
      });
      
      expect([404, 403]).toContain(response.status());
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('API-028: should handle concurrent search requests', async ({ page }) => {
      const searchTerms = ['push', 'pull', 'squat', 'bench', 'curl'];
      
      // Make concurrent requests
      const promises = searchTerms.map(term =>
        page.request.get(`/api/exercises/search?q=${term}`, {
          headers: authHeaders
        })
      );
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.status()).toBe(200);
      }
      
      // Verify data integrity
      for (let i = 0; i < responses.length; i++) {
        const data = await responses[i].json();
        expect(data).toHaveProperty('exercises');
      }
    });

    test('API-029: should handle large result sets efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Request a large number of exercises
      const response = await page.request.get('/api/exercises?limit=100', {
        headers: authHeaders
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Under 2 seconds
      
      const data = await response.json();
      expect(data.exercises.length).toBeLessThanOrEqual(100);
      
      console.log(`Large result set response time: ${responseTime}ms`);
    });

    test('API-030: should handle pagination efficiently', async ({ page }) => {
      const pages = [];
      let currentPage = 1;
      const limit = 20;
      
      // Fetch multiple pages
      while (pages.length < 5) { // Test first 5 pages
        const startTime = Date.now();
        
        const response = await page.request.get(`/api/exercises?page=${currentPage}&limit=${limit}`, {
          headers: authHeaders
        });
        
        const responseTime = Date.now() - startTime;
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(1000); // Each page under 1 second
        
        const data = await response.json();
        pages.push(data);
        
        if (data.exercises.length < limit) {
          break; // No more data
        }
        
        currentPage++;
      }
      
      // Verify pagination data consistency
      for (const pageData of pages) {
        expect(pageData).toHaveProperty('exercises');
        expect(pageData).toHaveProperty('total');
        expect(pageData).toHaveProperty('page');
        expect(pageData).toHaveProperty('limit');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('API-031: should handle malformed request data', async ({ page }) => {
      const response = await page.request.post('/api/exercises/collections', {
        headers: authHeaders,
        data: {
          name: null, // Invalid name
          description: 'A'.repeat(2000) // Too long description
        }
      });
      
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
    });

    test('API-032: should handle invalid query parameters', async ({ page }) => {
      const response = await page.request.get('/api/exercises?limit=invalid&page=notanumber', {
        headers: authHeaders
      });
      
      // Should either handle gracefully or return 400
      expect([200, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('exercises');
      }
    });

    test('API-033: should handle SQL injection attempts', async ({ page }) => {
      const maliciousQueries = [
        "'; DROP TABLE exercises; --",
        "1' OR '1'='1",
        "' UNION SELECT * FROM users --"
      ];
      
      for (const query of maliciousQueries) {
        const response = await page.request.get(`/api/exercises/search?q=${encodeURIComponent(query)}`, {
          headers: authHeaders
        });
        
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data).toHaveProperty('exercises');
        
        // Should return empty or safe results, not throw errors
        expect(Array.isArray(data.exercises)).toBe(true);
      }
    });

    test('API-034: should handle rate limiting gracefully', async ({ page }) => {
      // Make many rapid requests
      const requests = Array(50).fill(0).map(() =>
        page.request.get('/api/exercises/search?q=test', {
          headers: authHeaders
        })
      );
      
      const responses = await Promise.all(requests);
      
      // Most should succeed, some might be rate limited
      const successCount = responses.filter(r => r.status() === 200).length;
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      
      expect(successCount + rateLimitedCount).toBe(responses.length);
      expect(successCount).toBeGreaterThan(0); // At least some should succeed
    });

    test('API-035: should handle expired authentication tokens', async ({ page }) => {
      // Use expired or invalid token
      const invalidHeaders = { Authorization: 'Bearer invalid-token' };
      
      const response = await page.request.get('/api/exercises', {
        headers: invalidHeaders
      });
      
      expect(response.status()).toBe(401);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
    });
  });
});