export interface RiskGroupChild {
  id: string;
  _id?: string;
  childId: string;
  date: Date | string;
  riskFactors: string[];
  assessment: string;
  doctor: string;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAssessmentDate?: Date | string;
  recommendations?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // UI-поля для отображения
  fio?: string;
  birthdate?: string;
  // Legacy UI fields
  group?: string;
  address?: string;
  reason?: string;
}
