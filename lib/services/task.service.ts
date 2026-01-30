/**
 * Task Service
 * Business logic for task management operations
 * Epic 008: Task Management
 */

import { PrismaClient, TaskStatus, TaskPriority, TaskCategory, Prisma } from '@prisma/client';
import type {
  Task,
  TaskDetail,
  TaskListQuery,
  TaskListResponse,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskComment,
  CreateTaskCommentDTO,
  CreateTaskTemplateDTO,
  TaskTemplate,
  TaskStatistics,
  BulkTaskUpdateDTO,
  BulkTaskDeleteDTO,
} from '@/lib/types/task';

const prisma = new PrismaClient();

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(data: CreateTaskDTO, createdById: string): Promise<Task> {
    // Validate title
    if (!data.title || data.title.trim() === '') {
      throw new Error('Title is required');
    }

    const task = await prisma.task.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status || TaskStatus.pending,
        priority: data.priority || TaskPriority.medium,
        category: data.category || TaskCategory.other,
        assignedToId: data.assignedToId || null,
        createdById,
        programId: data.programId || null,
        workoutId: data.workoutId || null,
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return task as Task;
  }

  /**
   * Get list of tasks with filtering and pagination
   */
  async getTasks(query: TaskListQuery, userId: string): Promise<TaskListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      category,
      assignedTo,
      createdBy,
      programId,
      workoutId,
      dueBefore,
      dueAfter,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.TaskWhereInput = {};

    // Search by title or description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by assigned user
    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    // Filter by creator
    if (createdBy) {
      where.createdById = createdBy;
    }

    // Filter by program
    if (programId) {
      where.programId = programId;
    }

    // Filter by workout
    if (workoutId) {
      where.workoutId = workoutId;
    }

    // Filter by due date range
    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) {
        where.dueDate.lte = dueBefore;
      }
      if (dueAfter) {
        where.dueDate.gte = dueAfter;
      }
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return {
      tasks: tasks as Task[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string, userId: string): Promise<TaskDetail | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        workout: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });

    if (!task) {
      return null;
    }

    return task as TaskDetail;
  }

  /**
   * Update task
   */
  async updateTask(id: string, data: UpdateTaskDTO, userId: string): Promise<Task> {
    // Check if task exists
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    // Validate title if provided
    if (data.title !== undefined && data.title.trim() === '') {
      throw new Error('Title is required');
    }

    // Prepare update data
    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Set completion timestamp if completing
      if (data.status === TaskStatus.completed && !existing.completedAt) {
        updateData.completedAt = new Date();
        if (data.completedBy) {
          updateData.completedBy = data.completedBy;
        }
      }
      // Clear completion if un-completing
      if (data.status !== TaskStatus.completed) {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.category !== undefined) {
      updateData.category = data.category;
    }
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId || undefined;
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }
    if (data.dueTime !== undefined) {
      updateData.dueTime = data.dueTime;
    }
    if (data.completedBy !== undefined) {
      updateData.completedBy = data.completedBy;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return task as Task;
  }

  /**
   * Delete task
   */
  async deleteTask(id: string, userId: string): Promise<Task> {
    // Check if task exists
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    const task = await prisma.task.delete({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return task as Task;
  }

  /**
   * Add comment to task
   */
  async addComment(taskId: string, data: CreateTaskCommentDTO, userId: string): Promise<TaskComment> {
    // Validate comment
    if (!data.comment || data.comment.trim() === '') {
      throw new Error('Comment is required');
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        comment: data.comment.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return comment as TaskComment;
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(userId: string): Promise<TaskStatistics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [total, pending, inProgress, completed, cancelled, overdue, dueToday, dueThisWeek] =
      await Promise.all([
        // Total tasks
        prisma.task.count({
          where: {
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // Pending tasks
        prisma.task.count({
          where: {
            status: TaskStatus.pending,
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // In progress tasks
        prisma.task.count({
          where: {
            status: TaskStatus.in_progress,
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // Completed tasks
        prisma.task.count({
          where: {
            status: TaskStatus.completed,
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // Cancelled tasks
        prisma.task.count({
          where: {
            status: TaskStatus.cancelled,
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // Overdue tasks
        prisma.task.count({
          where: {
            dueDate: { lt: today },
            status: { in: [TaskStatus.pending, TaskStatus.in_progress] },
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // Due today
        prisma.task.count({
          where: {
            dueDate: today,
            status: { in: [TaskStatus.pending, TaskStatus.in_progress] },
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
        // Due this week
        prisma.task.count({
          where: {
            dueDate: { gte: today, lte: weekEnd },
            status: { in: [TaskStatus.pending, TaskStatus.in_progress] },
            OR: [{ assignedToId: userId }, { createdById: userId }],
          },
        }),
      ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      overdue,
      dueToday,
      dueThisWeek,
    };
  }

  /**
   * Create task template
   */
  async createTaskTemplate(data: CreateTaskTemplateDTO, createdById: string): Promise<TaskTemplate> {
    // Validate name
    if (!data.name || data.name.trim() === '') {
      throw new Error('Name is required');
    }

    const template = await prisma.taskTemplate.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        priority: data.priority || TaskPriority.medium,
        estimatedDuration: data.estimatedDuration || null,
        isPublic: data.isPublic || false,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return template as TaskTemplate;
  }

  /**
   * Complete task
   */
  async completeTask(id: string, userId: string): Promise<Task> {
    // Check if task exists
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    if (existing.status === TaskStatus.completed) {
      throw new Error('Task is already completed');
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.completed,
        completedAt: new Date(),
        completedBy: userId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return task as Task;
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(data: BulkTaskUpdateDTO, userId: string): Promise<Task[]> {
    const { taskIds, updates } = data;

    // Prepare update data
    const updateData: Prisma.TaskUpdateInput = {};

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }
    if (updates.assignedToId !== undefined) {
      updateData.assignedTo = updates.assignedToId || undefined;
    }
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate;
    }
    if (updates.dueTime !== undefined) {
      updateData.dueTime = updates.dueTime;
    }

    // Update all tasks (skip non-existent ones)
    const tasks = await Promise.all(
      taskIds.map(async (id) => {
        try {
          return await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
              assignedTo: {
                select: {
                  id: true,
                  email: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          });
        } catch {
          // Task doesn't exist, skip it
          return null;
        }
      })
    );

    // Filter out null values (non-existent tasks)
    return tasks.filter((t) => t !== null) as Task[];
  }

  /**
   * Bulk delete tasks
   */
  async bulkDeleteTasks(data: BulkTaskDeleteDTO, userId: string): Promise<void> {
    const { taskIds } = data;

    // Delete all tasks (skip non-existent ones)
    await Promise.all(
      taskIds.map(async (id) => {
        try {
          await prisma.task.delete({
            where: { id },
          });
        } catch {
          // Task doesn't exist, skip it
        }
      })
    );
  }
}

// Export singleton instance
export const taskService = new TaskService();
