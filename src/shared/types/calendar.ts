export type CalendarEventType = 'holiday' | 'event' | 'other';

export interface CalendarEvent {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  date: string | Date;
  type: CalendarEventType;
  isRecurring?: boolean;
  createdBy?: {
    _id: string;
    fullName: string;
  } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  date: string | Date;
  type: CalendarEventType;
  isRecurring?: boolean;
}
