export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed' | 'archived';

export interface Task {
  id: string;
  userId: string;
  categoryId?: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  dueTime?: string; // HH:MM format
  priority: Priority;
  status: TaskStatus;
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  _count?: {
    tasks: number;
  };
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  categoryId?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: TaskStatus;
}

// Natural Language Processing types
export type AmbiguousElementType = 'date' | 'time' | 'priority' | 'category';

export interface ParsedInput {
  title: string;
  dueDate?: Date | string;
  dueTime?: string;
  priority?: Priority;
  category?: string;
  confidence: number;
  ambiguousElements?: AmbiguousElement[];
}

export interface AmbiguousElement {
  type: AmbiguousElementType;
  originalText: string;
  suggestions: Suggestion[];
}

export interface Suggestion {
  value: string | Date;
  display: string;
  confidence: number;
}

export interface ParseRequest {
  input: string;
  referenceDate?: string;
}

export interface ParseResponse {
  parsed: ParsedInput;
  success: boolean;
  error?: string;
}

export interface DisambiguationResponse {
  success: boolean;
  ambiguousElements: AmbiguousElement[];
  error?: string;
}
