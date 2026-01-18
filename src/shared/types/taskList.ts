
export interface UserRef {
  _id: string;
  fullName: string;
  role: string;
}

export interface TaskList {
  _id?: string;
  title: string;
  description?: string;
  assignedTo: string | UserRef;
  assignedBy: string | UserRef;
  assignedToSpecificUser?: string | UserRef;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  attachments?: string[];
  notes?: string;
  completedAt?: string;
  cancelledAt?: string;
  completedBy?: string | UserRef;
  cancelledBy?: string | UserRef;
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
