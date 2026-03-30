import api from '../../../shared/utils/api';
import { CalendarEvent, CalendarEventCreate } from '../../../shared/types/calendar';

const calendarEventsApi = {
  getAll: async (filters: { startDate?: string; endDate?: string; type?: string } = {}) => {
    const response = await api.get<CalendarEvent[]>('/calendar-events', { params: filters });
    return response.data;
  },

  create: async (data: CalendarEventCreate) => {
    const response = await api.post<CalendarEvent>('/calendar-events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CalendarEventCreate>) => {
    const response = await api.patch<CalendarEvent>(`/calendar-events/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/calendar-events/${id}`);
    return response.data;
  }
};

export default calendarEventsApi;
