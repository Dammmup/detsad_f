
import { api } from './settings';

// REACT_APP_API_URL и авторизация берутся из settings.ts

export interface TaskList {
  _id?: string;
  title: string;
  description?: string;
 completed: boolean;
 assignedTo?: string; // ID пользователя
  createdBy: string; // ID пользователя
  assignedToSpecificUser?: string; // ID пользователя для конкретного назначения
  dueDate?: string; // ISO string
  priority: 'low' | 'medium' | 'high';
  category?: string;
 createdAt?: string;
 updatedAt?: string;
}

export interface TaskListFilters {
  assignedTo?: string;
  createdBy?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  search?: string;
}

// Получить список задач
export const getTaskList = async (filters: TaskListFilters = {}): Promise<TaskList[]> => {
  try {
  const response = await api.get('/task-list', {
    params: filters
  });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching task list:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения списка задач');
  }
};

// Создать новую задачу
export const createTask = async (taskData: Omit<TaskList, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<TaskList> => {
  try {
    const response = await api.post('/task-list', taskData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка создания задачи');
  }
};

// Обновить задачу
export const updateTask = async (id: string, taskData: Partial<TaskList>): Promise<TaskList> => {
  try {
  const response = await api.put(`/task-list/${id}`, taskData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка обновления задачи');
  }
};

// Удалить задачу
export const deleteTask = async (id: string): Promise<void> => {
 try {
  await api.delete(`/task-list/${id}`);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка удаления задачи');
  }
};

// Переключить статус задачи
export const toggleTaskStatus = async (id: string): Promise<TaskList> => {
  try {
  const response = await api.patch(`/task-list/${id}/toggle`);
    return response.data;
  } catch (error: any) {
    console.error('Error toggling task status:', error);
    throw new Error(error.response?.data?.error || 'Ошибка переключения статуса задачи');
  }
};