import axios from 'axios';
import { User } from '../../types/common';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export interface TaskList {
  _id?: string;
 title: string;
  description?: string;
  completed: boolean;
 assignedTo?: User;
  createdBy: User;
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
    const response = await axios.get(`${API_URL}/task-list`, {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching task list:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения списка задач');
  }
};

// Создать новую задачу
export const createTask = async (taskData: Omit<TaskList, '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'assignedTo'> & { assignedTo?: string }): Promise<TaskList> => {
  try {
    const response = await axios.post(`${API_URL}/task-list`, taskData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка создания задачи');
  }
};

// Обновить задачу
export const updateTask = async (id: string, taskData: Partial<TaskList>): Promise<TaskList> => {
  try {
    const response = await axios.put(`${API_URL}/task-list/${id}`, taskData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка обновления задачи');
  }
};

// Удалить задачу
export const deleteTask = async (id: string): Promise<void> => {
 try {
    await axios.delete(`${API_URL}/task-list/${id}`);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка удаления задачи');
  }
};

// Переключить статус задачи
export const toggleTaskStatus = async (id: string): Promise<TaskList> => {
  try {
    const response = await axios.patch(`${API_URL}/task-list/${id}/toggle`);
    return response.data;
  } catch (error: any) {
    console.error('Error toggling task status:', error);
    throw new Error(error.response?.data?.error || 'Ошибка переключения статуса задачи');
  }
};