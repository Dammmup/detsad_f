export interface SomaticRecord {
  id: string;
  _id?: string;
  childId: string;
  date: Date | string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  doctor: string;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date | string;
  recommendations?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // UI-поля для отображения
  fio?: string;
  birthdate?: string;
  // Legacy UI fields
  fromDate?: string;
  toDate?: string;
  days?: number;
  address?: string;
}
