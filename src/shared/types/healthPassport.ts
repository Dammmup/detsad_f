export interface VaccinationEntry {
  vaccine: string;
  date: Date | string;
  nextDate?: Date | string;
  notes?: string;
}

export interface DoctorExaminationEntry {
  doctor: string;
  date: Date | string;
  result: string;
  notes?: string;
}

export interface HealthPassportRecord {
  id: string;
  _id?: string;
  childId: string;
  birthDate: Date | string;
  birthPlace: string;
  bloodType: 'A' | 'B' | 'AB' | 'O';
  rhesus: 'positive' | 'negative';
  chronicDiseases: string[];
  allergies: string[];
  vaccinationHistory: VaccinationEntry[];
  doctorExaminations: DoctorExaminationEntry[];
  notes?: string;
  attachments?: string[];
  status: 'active' | 'inactive' | 'archived';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // UI-поля для отображения
  fio?: string;
  birthdate?: string;
  // Legacy UI fields
  group?: string;
  main_diagnosis?: string;
  vaccinations?: string;
}
