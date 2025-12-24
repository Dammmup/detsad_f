export interface InfectiousDiseaseRecord {
  id: string;
  _id?: string;
  childId: string;
  date: Date | string;
  disease: string;
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
  group?: string;
  // Legacy UI fields
  diagnosis?: string;
  quarantine_days?: number;
  observation?: string;
}
