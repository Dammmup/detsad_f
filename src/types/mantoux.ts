export interface MantouxRecord {
  id: string;
  _id?: string;
  childId: string;
  date: Date | string;
  reactionSize: number;
  reactionType: 'negative' | 'positive' | 'hyperergic';
  injectionSite: string;
  doctor: string;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date | string;
  recommendations?: string;
  mm?: number;
  year?: string;
  atr?: string;
  diagnosis?: string;
  has063?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // UI-поля для отображения
  fio?: string;
  address?: string;
  birthdate?: string;
}
