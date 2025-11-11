// Тип для пользователя
export interface UserRef {
  _id: string;
  fullName: string;
  role: string;
}

export interface TaskList {
  _id?: string;
  title: string;
  description?: string;
  assignedTo: string | UserRef; // Может быть ID или populated объектом
  assignedBy: string | UserRef; // Может быть ID или populated объектом
  assignedToSpecificUser?: string | UserRef; // Может быть ID или populated объектом
  dueDate?: string; // ISO string
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  attachments?: string[];
  notes?: string;
  completedAt?: string; // Дата выполнения
  cancelledAt?: string; // Дата отмены
  completedBy?: string | UserRef; // Может быть ID или populated объектом
  cancelledBy?: string | UserRef; // Может быть ID или populated объектом
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskListFilters {
  assignedTo?: string;
  assignedBy?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
