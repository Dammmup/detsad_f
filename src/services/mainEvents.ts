import { apiClient } from '../utils/api';

// Интерфейсы для типизации
export interface MainEvent {
  _id: string;
  name: string;
  description: string;
  dayOfMonth: number;
  enabled: boolean;
  exportCollections: string[];
  emailRecipients: string[];
  lastExecutedAt?: string;
  nextExecutionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MainEventCreateInput {
  name: string;
  description: string;
  dayOfMonth: number;
  enabled: boolean;
  exportCollections: string[];
  emailRecipients: string[];
}

export interface MainEventUpdateInput {
  name?: string;
  description?: string;
  dayOfMonth?: number;
  enabled?: boolean;
  exportCollections?: string[];
  emailRecipients?: string[];
}

class MainEventsService {
  // Получить все события
  async getAll(enabled?: boolean): Promise<MainEvent[]> {
    const params = new URLSearchParams();
    if (enabled !== undefined) {
      params.append('enabled', enabled.toString());
    }
    
    const response = await apiClient.get<MainEvent[]>(`/main-events?${params.toString()}`);
    return response.data;
  }

  // Получить событие по ID
  async getById(id: string): Promise<MainEvent> {
    const response = await apiClient.get<MainEvent>(`/main-events/${id}`);
    return response.data;
  }

  // Создать новое событие
  async create(data: MainEventCreateInput): Promise<MainEvent> {
    const response = await apiClient.post<MainEvent>('/main-events', data);
    return response.data;
  }

  // Обновить событие
  async update(id: string, data: MainEventUpdateInput): Promise<MainEvent> {
    const response = await apiClient.put<MainEvent>(`/main-events/${id}`, data);
    return response.data;
  }

  // Удалить событие
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/main-events/${id}`);
    return response.data;
  }

  // Переключить активность события
  async toggleEnabled(id: string, enabled: boolean): Promise<MainEvent> {
    const response = await apiClient.patch<MainEvent>(`/main-events/${id}/toggle-enabled`, { enabled });
    return response.data;
  }

  // Выполнить экспорт для события
  async executeExport(id: string): Promise<any> {
    const response = await apiClient.post<any>(`/main-events/${id}/export`);
    return response.data;
  }

  // Выполнить проверку и выполнение всех активных событий
  async executeScheduled(): Promise<any> {
    const response = await apiClient.post<any>('/main-events/execute-scheduled');
    return response.data;
  }
}

export const mainEventsService = new MainEventsService();