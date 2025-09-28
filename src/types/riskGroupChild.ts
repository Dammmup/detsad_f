export interface RiskGroupChild {
  id: string;
  childId: string;
  fio: string;
  birthdate: string;
  group: string;
  address: string;
  reason: string;
  notes?: string;
}
