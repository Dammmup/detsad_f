export interface ContactInfectionRecord {
  id: string;
  _id?: string;
  childId: string;
  date: Date | string;
  infectionType: string;
  symptoms: string[];
  treatment: string;
  doctor: string;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date | string;
  recommendations?: string;
  isolationPeriod?: number;
  isolationEndDate?: Date | string;
  contactsTraced?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // UI-поля для отображения (populate данные)
  fio?: string;
  birthdate?: string;
  group?: string;
  stool?: string; // legacy UI field
}
