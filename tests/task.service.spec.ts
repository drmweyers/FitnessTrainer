/**
 * Task Service Tests
 * Epic 008: Task Management
 *
 * TDD Approach: RED phase - Write failing tests first
 */

import { TaskService } from '@/lib/services/task.service';
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';
import type {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskListQuery,
  CreateTaskCommentDTO,
  CreateTaskTemplateDTO,
  TaskStatistics,
} from '@/lib/types/task';

// Helper to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
  });

  describe('createTask', () => {
    it('should create a new task with valid data', async () => {
      const userId = generateUUID();
      const trainerId = generateUUID();

      const taskData: CreateTaskDTO = {
        title: 'Review client progress',
        description: 'Check workout logs and provide feedback',
        status: TaskStatus.pending,
        priority: TaskPriority.medium,
        category: TaskCategory.client_communication,
        assignedToId: userId,
        dueDate: new Date('2026-02-01'),
      };

      const result = await taskService.createTask(taskData, trainerId);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(taskData.title);
      expect(result.description).toBe(taskData.description);
      expect(result.status).toBe(taskData.status);
      expect(result.priority).toBe(taskData.priority);
      expect(result.category).toBe(taskData.category);
      expect(result.assignedToId).toBe(taskData.assignedToId);
      expect(result.createdById).toBe(generateUUID());
    });

    it('should create task with default values when optional fields are not provided', async () => {
      const taskData: CreateTaskDTO = {
        title: 'Simple task',
      };

      const result = await taskService.createTask(taskData, generateUUID());

      expect(result.status).toBe(TaskStatus.pending);
      expect(result.priority).toBe(TaskPriority.medium);
      expect(result.category).toBe(TaskCategory.other);
      expect(result.assignedToId).toBeNull();
    });

    it('should reject task creation with empty title', async () => {
      const taskData: CreateTaskDTO = {
        title: '',
      };

      await expect(
        taskService.createTask(taskData, generateUUID())
      ).rejects.toThrow('Title is required');
    });

    it('should link task to program when programId is provided', async () => {
      const taskData: CreateTaskDTO = {
        title: 'Program task',
        programId: generateUUID(),
      };

      const result = await taskService.createTask(taskData, generateUUID());

      expect(result.programId).toBe(generateUUID());
    });

    it('should link task to workout when workoutId is provided', async () => {
      const taskData: CreateTaskDTO = {
        title: 'Workout prep task',
        workoutId: generateUUID(),
      };

      const result = await taskService.createTask(taskData, generateUUID());

      expect(result.workoutId).toBe(generateUUID());
    });
  });

  describe('getTasks', () => {
    it('should return paginated list of tasks', async () => {
      const query: TaskListQuery = {
        page: 1,
        limit: 10,
      };

      const result = await taskService.getTasks(query, generateUUID());

      expect(result).toBeDefined();
      expect(result.tasks).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBeGreaterThanOrEqual(0);
      expect(result.pagination.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should filter tasks by status', async () => {
      const query: TaskListQuery = {
        status: TaskStatus.pending,
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        expect(task.status).toBe(TaskStatus.pending);
      });
    });

    it('should filter tasks by priority', async () => {
      const query: TaskListQuery = {
        priority: TaskPriority.high,
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        expect(task.priority).toBe(TaskPriority.high);
      });
    });

    it('should filter tasks by category', async () => {
      const query: TaskListQuery = {
        category: TaskCategory.workout_preparation,
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        expect(task.category).toBe(TaskCategory.workout_preparation);
      });
    });

    it('should filter tasks by assigned user', async () => {
      const query: TaskListQuery = {
        assignedTo: generateUUID(),
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        expect(task.assignedToId).toBe(generateUUID());
      });
    });

    it('should filter tasks by creator', async () => {
      const query: TaskListQuery = {
        createdBy: generateUUID(),
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        expect(task.createdById).toBe(generateUUID());
      });
    });

    it('should search tasks by title or description', async () => {
      const query: TaskListQuery = {
        search: 'progress',
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        const matchesTitle = task.title.toLowerCase().includes('progress');
        const matchesDescription =
          task.description?.toLowerCase().includes('progress') || false;
        expect(matchesTitle || matchesDescription).toBe(true);
      });
    });

    it('should sort tasks by due date ascending', async () => {
      const query: TaskListQuery = {
        sortBy: 'dueDate',
        sortOrder: 'asc',
      };

      const result = await taskService.getTasks(query, generateUUID());

      for (let i = 1; i < result.tasks.length; i++) {
        const prev = result.tasks[i - 1].dueDate;
        const curr = result.tasks[i].dueDate;
        if (prev && curr) {
          expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
        }
      }
    });

    it('should sort tasks by priority descending', async () => {
      const query: TaskListQuery = {
        sortBy: 'priority',
        sortOrder: 'desc',
      };

      const result = await taskService.getTasks(query, generateUUID());

      const priorityOrder = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      for (let i = 1; i < result.tasks.length; i++) {
        const prev = priorityOrder[result.tasks[i - 1].priority];
        const curr = priorityOrder[result.tasks[i].priority];
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('should filter tasks by due date range', async () => {
      const query: TaskListQuery = {
        dueAfter: new Date('2026-02-01'),
        dueBefore: new Date('2026-02-28'),
      };

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        if (task.dueDate) {
          expect(task.dueDate.getTime()).toBeGreaterThanOrEqual(
            new Date('2026-02-01').getTime()
          );
          expect(task.dueDate.getTime()).toBeLessThanOrEqual(
            new Date('2026-02-28').getTime()
          );
        }
      });
    });

    it('should include assigned user and creator details', async () => {
      const query: TaskListQuery = {};

      const result = await taskService.getTasks(query, generateUUID());

      result.tasks.forEach((task) => {
        if (task.assignedToId) {
          expect(task.assignedTo).toBeDefined();
          expect(task.assignedTo?.id).toBeDefined();
        }
        expect(task.createdBy).toBeDefined();
        expect(task.createdBy?.id).toBeDefined();
      });
    });
  });

  describe('getTaskById', () => {
    it('should return task by id', async () => {
      // First create a task
      const taskData: CreateTaskDTO = {
        title: 'Test task',
      };
      const created = await taskService.createTask(taskData, generateUUID());

      // Then get it by id
      const result = await taskService.getTaskById(created.id, generateUUID());

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.title).toBe(created.title);
    });

    it('should return null for non-existent task', async () => {
      const result = await taskService.getTaskById(generateUUID(), generateUUID());

      expect(result).toBeNull();
    });

    it('should include program details when linked', async () => {
      const taskData: CreateTaskDTO = {
        title: 'Program task',
        programId: generateUUID(),
      };
      const created = await taskService.createTask(taskData, generateUUID());

      const result = await taskService.getTaskById(created.id, generateUUID());

      expect(result?.program).toBeDefined();
      expect(result?.program?.id).toBe(generateUUID());
    });

    it('should include workout details when linked', async () => {
      const taskData: CreateTaskDTO = {
        title: 'Workout task',
        workoutId: generateUUID(),
      };
      const created = await taskService.createTask(taskData, generateUUID());

      const result = await taskService.getTaskById(created.id, generateUUID());

      expect(result?.workout).toBeDefined();
      expect(result?.workout?.id).toBe(generateUUID());
    });

    it('should include comments and attachments', async () => {
      const taskData: CreateTaskDTO = {
        title: 'Task with comments',
      };
      const created = await taskService.createTask(taskData, generateUUID());

      // Add comment
      await taskService.addComment(created.id, {
        comment: 'Test comment',
      }, generateUUID());

      const result = await taskService.getTaskById(created.id, generateUUID());

      expect(result?.comments).toBeDefined();
      expect(result?.comments.length).toBeGreaterThan(0);
    });
  });

  describe('updateTask', () => {
    it('should update task title', async () => {
      const created = await taskService.createTask(
        { title: 'Original title' },
        generateUUID()
      );

      const updateData: UpdateTaskDTO = {
        title: 'Updated title',
      };

      const result = await taskService.updateTask(created.id, updateData, generateUUID());

      expect(result.title).toBe('Updated title');
    });

    it('should update task status', async () => {
      const created = await taskService.createTask(
        { title: 'Task to update' },
        generateUUID()
      );

      const updateData: UpdateTaskDTO = {
        status: TaskStatus.in_progress,
      };

      const result = await taskService.updateTask(created.id, updateData, generateUUID());

      expect(result.status).toBe(TaskStatus.in_progress);
    });

    it('should update task priority', async () => {
      const created = await taskService.createTask(
        { title: 'Task to update' },
        generateUUID()
      );

      const updateData: UpdateTaskDTO = {
        priority: TaskPriority.urgent,
      };

      const result = await taskService.updateTask(created.id, updateData, generateUUID());

      expect(result.priority).toBe(TaskPriority.urgent);
    });

    it('should update task assignment', async () => {
      const created = await taskService.createTask(
        { title: 'Task to assign' },
        generateUUID()
      );

      const updateData: UpdateTaskDTO = {
        assignedToId: generateUUID(),
      };

      const result = await taskService.updateTask(created.id, updateData, generateUUID());

      expect(result.assignedToId).toBe(generateUUID());
    });

    it('should update due date', async () => {
      const created = await taskService.createTask(
        { title: 'Task with due date' },
        generateUUID()
      );

      const newDueDate = new Date('2026-02-15');
      const updateData: UpdateTaskDTO = {
        dueDate: newDueDate,
      };

      const result = await taskService.updateTask(created.id, updateData, generateUUID());

      expect(result.dueDate).toEqual(newDueDate);
    });

    it('should set completion timestamp when status is completed', async () => {
      const created = await taskService.createTask(
        { title: 'Task to complete' },
        generateUUID()
      );

      const updateData: UpdateTaskDTO = {
        status: TaskStatus.completed,
        completedBy: generateUUID(),
      };

      const result = await taskService.updateTask(created.id, updateData, generateUUID());

      expect(result.status).toBe(TaskStatus.completed);
      expect(result.completedAt).toBeDefined();
      expect(result.completedBy).toBe(generateUUID());
    });

    it('should reject update with empty title', async () => {
      const created = await taskService.createTask(
        { title: 'Valid title' },
        generateUUID()
      );

      const updateData: UpdateTaskDTO = {
        title: '',
      };

      await expect(
        taskService.updateTask(created.id, updateData, generateUUID())
      ).rejects.toThrow('Title is required');
    });

    it('should throw error for non-existent task', async () => {
      const updateData: UpdateTaskDTO = {
        title: 'Updated title',
      };

      await expect(
        taskService.updateTask(generateUUID(), updateData, generateUUID())
      ).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete task by id', async () => {
      const created = await taskService.createTask(
        { title: 'Task to delete' },
        generateUUID()
      );

      await taskService.deleteTask(created.id, generateUUID());

      const result = await taskService.getTaskById(created.id, generateUUID());
      expect(result).toBeNull();
    });

    it('should throw error when deleting non-existent task', async () => {
      await expect(
        taskService.deleteTask(generateUUID(), generateUUID())
      ).rejects.toThrow('Task not found');
    });
  });

  describe('addComment', () => {
    it('should add comment to task', async () => {
      const task = await taskService.createTask(
        { title: 'Task for comment' },
        generateUUID()
      );

      const commentData: CreateTaskCommentDTO = {
        comment: 'This is a test comment',
      };

      const result = await taskService.addComment(
        task.id,
        commentData,
        generateUUID()
      );

      expect(result).toBeDefined();
      expect(result.comment).toBe(commentData.comment);
      expect(result.userId).toBe(generateUUID());
      expect(result.taskId).toBe(task.id);
    });

    it('should reject empty comment', async () => {
      const task = await taskService.createTask(
        { title: 'Task for comment' },
        generateUUID()
      );

      await expect(
        taskService.addComment(task.id, { comment: '' }, generateUUID())
      ).rejects.toThrow('Comment is required');
    });

    it('should throw error for non-existent task', async () => {
      await expect(
        taskService.addComment(generateUUID(), { comment: 'Test' }, generateUUID())
      ).rejects.toThrow('Task not found');
    });
  });

  describe('getTaskStatistics', () => {
    it('should return task statistics', async () => {
      // Create some tasks
      await taskService.createTask(
        { title: 'Pending task', status: TaskStatus.pending },
        generateUUID()
      );
      await taskService.createTask(
        { title: 'In progress task', status: TaskStatus.in_progress },
        generateUUID()
      );
      await taskService.createTask(
        { title: 'Completed task', status: TaskStatus.completed },
        generateUUID()
      );

      const stats: TaskStatistics = await taskService.getTaskStatistics(generateUUID());

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.pending).toBeGreaterThanOrEqual(1);
      expect(stats.inProgress).toBeGreaterThanOrEqual(1);
      expect(stats.completed).toBeGreaterThanOrEqual(1);
    });

    it('should count overdue tasks', async () => {
      const pastDate = new Date('2025-01-01');
      await taskService.createTask(
        {
          title: 'Overdue task',
          dueDate: pastDate,
          status: TaskStatus.pending,
        },
        generateUUID()
      );

      const stats = await taskService.getTaskStatistics(generateUUID());

      expect(stats.overdue).toBeGreaterThan(0);
    });

    it('should count tasks due today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await taskService.createTask(
        {
          title: 'Due today task',
          dueDate: today,
          status: TaskStatus.pending,
        },
        generateUUID()
      );

      const stats = await taskService.getTaskStatistics(generateUUID());

      expect(stats.dueToday).toBeGreaterThan(0);
    });

    it('should count tasks due this week', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      await taskService.createTask(
        {
          title: 'Due this week task',
          dueDate: futureDate,
          status: TaskStatus.pending,
        },
        generateUUID()
      );

      const stats = await taskService.getTaskStatistics(generateUUID());

      expect(stats.dueThisWeek).toBeGreaterThan(0);
    });
  });

  describe('createTaskTemplate', () => {
    it('should create task template', async () => {
      const templateData: CreateTaskTemplateDTO = {
        name: 'Client Review Template',
        description: 'Template for reviewing client progress',
        category: TaskCategory.client_communication,
        priority: TaskPriority.medium,
        estimatedDuration: 30,
      };

      const result = await taskService.createTaskTemplate(templateData, generateUUID());

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.description).toBe(templateData.description);
      expect(result.category).toBe(templateData.category);
      expect(result.priority).toBe(templateData.priority);
      expect(result.estimatedDuration).toBe(templateData.estimatedDuration);
    });

    it('should reject template with empty name', async () => {
      const templateData: CreateTaskTemplateDTO = {
        name: '',
        category: TaskCategory.other,
      };

      await expect(
        taskService.createTaskTemplate(templateData, generateUUID())
      ).rejects.toThrow('Name is required');
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed', async () => {
      const task = await taskService.createTask(
        { title: 'Task to complete' },
        generateUUID()
      );

      const result = await taskService.completeTask(task.id, generateUUID());

      expect(result.status).toBe(TaskStatus.completed);
      expect(result.completedAt).toBeDefined();
      expect(result.completedBy).toBe(generateUUID());
    });

    it('should throw error when completing already completed task', async () => {
      const task = await taskService.createTask(
        { title: 'Already completed' },
        generateUUID()
      );

      await taskService.completeTask(task.id, generateUUID());

      await expect(
        taskService.completeTask(task.id, generateUUID())
      ).rejects.toThrow('Task is already completed');
    });
  });

  describe('bulkUpdateTasks', () => {
    it('should update multiple tasks at once', async () => {
      const task1 = await taskService.createTask(
        { title: 'Task 1' },
        generateUUID()
      );
      const task2 = await taskService.createTask(
        { title: 'Task 2' },
        generateUUID()
      );

      const result = await taskService.bulkUpdateTasks(
        {
          taskIds: [task1.id, task2.id],
          updates: { status: TaskStatus.completed },
        },
        generateUUID()
      );

      expect(result).toHaveLength(2);
      result.forEach((task) => {
        expect(task.status).toBe(TaskStatus.completed);
      });
    });

    it('should skip non-existent tasks in bulk update', async () => {
      const task = await taskService.createTask(
        { title: 'Valid task' },
        generateUUID()
      );

      const result = await taskService.bulkUpdateTasks(
        {
          taskIds: [task.id, generateUUID()],
          updates: { status: TaskStatus.completed },
        },
        generateUUID()
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(task.id);
    });
  });

  describe('bulkDeleteTasks', () => {
    it('should delete multiple tasks at once', async () => {
      const task1 = await taskService.createTask(
        { title: 'Task 1' },
        generateUUID()
      );
      const task2 = await taskService.createTask(
        { title: 'Task 2' },
        generateUUID()
      );

      await taskService.bulkDeleteTasks(
        { taskIds: [task1.id, task2.id] },
        generateUUID()
      );

      const result1 = await taskService.getTaskById(task1.id, generateUUID());
      const result2 = await taskService.getTaskById(task2.id, generateUUID());

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});
