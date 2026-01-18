import { apiClient } from '../../../shared/utils/api';
import { TaskList, TaskListFilters } from '../../../shared/types/taskList';




export const getTaskList = async (
  filters: TaskListFilters = {},
): Promise<TaskList[]> => {
  try {
    const response = await apiClient.get('/task-list', {
      params: filters,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching task list:', error);
    throw new Error(
      error.response?.data?.error || 'Ошибка получения списка задач',
    );
  }
};


export const createTask = async (
  taskData: Omit<TaskList, '_id' | 'createdAt' | 'updatedAt'>,
): Promise<TaskList> => {
  try {
    const response = await apiClient.post('/task-list', taskData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка создания задачи');
  }
};


export const updateTask = async (
  id: string,
  taskData: Partial<TaskList>,
): Promise<TaskList> => {
  try {
    const response = await apiClient.put(`/task-list/${id}`, taskData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка обновления задачи');
  }
};


export const deleteTask = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/task-list/${id}`);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error(error.response?.data?.error || 'Ошибка удаления задачи');
  }
};


export const toggleTaskStatus = async (
  id: string,
  userId: string,
): Promise<TaskList> => {
  try {
    const response = await apiClient.patch(`/task-list/${id}/toggle`, {
      userId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error toggling task status:', error);
    throw new Error(
      error.response?.data?.error || 'Ошибка переключения статуса задачи',
    );
  }
};


export const markTaskAsCompleted = async (
  id: string,
  userId: string,
): Promise<TaskList> => {
  try {
    const response = await apiClient.patch(`/task-list/${id}/complete`, {
      userId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error marking task as completed:', error);
    throw new Error(error.response?.data?.error || 'Ошибка завершения задачи');
  }
};


export const markTaskAsCancelled = async (
  id: string,
  userId: string,
): Promise<TaskList> => {
  try {
    const response = await apiClient.patch(`/task-list/${id}/cancel`, {
      userId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error marking task as cancelled:', error);
    throw new Error(error.response?.data?.error || 'Ошибка отмены задачи');
  }
};


export const markTaskAsInProgress = async (id: string): Promise<TaskList> => {
  try {
    const response = await apiClient.patch(`/task-list/${id}/in-progress`);
    return response.data;
  } catch (error: any) {
    console.error('Error marking task as in progress:', error);
    throw new Error(
      error.response?.data?.error ||
      'Ошибка перевода задачи в статус "в работе"',
    );
  }
};


export const updateTaskPriority = async (
  id: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
): Promise<TaskList> => {
  try {
    const response = await apiClient.patch(`/task-list/${id}/priority`, {
      priority,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating task priority:', error);
    throw new Error(
      error.response?.data?.error || 'Ошибка обновления приоритета задачи',
    );
  }
};
