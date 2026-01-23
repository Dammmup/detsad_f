export interface HelminthRecord {
  id: string;
  _id?: string;
  childId: string;
  date: Date | string;
  result: string;
  doctor: string;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date | string;
  recommendations?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // UI-поля для отображения (populate данные)
  fio?: string;
  birthdate?: string;
  address?: string;
  // Legacy UI fields для обратной совместимости
  month?: string;
  year?: string;
  examType?: 'primary' | 'annual';
}
