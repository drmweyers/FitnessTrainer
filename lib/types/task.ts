/**
 * Task Management Types
 * Epic 008: Task Management
 */

import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';

// Task API response types
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignedToId: string | null;
  createdById: string;
  programId: string | null;
  workoutId: string | null;
  dueDate: Date | null;
  dueTime: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  assignedTo?: {
    id: string;
    email: string;
  };
  createdBy?: {
    id: string;
    email: string;
  };
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

// Task detail response with full relations
export interface TaskDetail extends Task {
  program?: {
    id: string;
    name: string;
  };
  workout?: {
    id: string;
    name: string;
  };
}

// Task list query parameters
export interface TaskListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  assignedTo?: string;
  createdBy?: string;
  programId?: string;
  workoutId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  sortBy?: 'title' | 'dueDate' | 'priority' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Task list response
export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Task creation payload
export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  assignedToId?: string;
  programId?: string;
  workoutId?: string;
  dueDate?: Date;
  dueTime?: string;
}

// Task update payload
export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  assignedToId?: string | null;
  dueDate?: Date | null;
  dueTime?: string | null;
  completedAt?: Date | null;
  completedBy?: string | null;
}

// Task comment types
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date | null;
  user?: {
    id: string;
    email: string;
  };
}

// Task comment creation payload
export interface CreateTaskCommentDTO {
  comment: string;
}

// Task attachment types
export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  createdAt: Date;
}

// Task attachment creation payload
export interface CreateTaskAttachmentDTO {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

// Task template types
export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedDuration: number | null;
  isPublic: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

// Task template creation payload
export interface CreateTaskTemplateDTO {
  name: string;
  description?: string;
  category: TaskCategory;
  priority?: TaskPriority;
  estimatedDuration?: number;
  isPublic?: boolean;
}

// Task reminder types
export interface TaskReminder {
  id: string;
  taskId: string;
  userId: string;
  reminderAt: Date;
  isSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
}

// Task reminder creation payload
export interface CreateTaskReminderDTO {
  reminderAt: Date;
}

// Task statistics
export interface TaskStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

// Bulk task operations
export interface BulkTaskUpdateDTO {
  taskIds: string[];
  updates: UpdateTaskDTO;
}

export interface BulkTaskDeleteDTO {
  taskIds: string[];
}
