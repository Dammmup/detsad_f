export interface InfectiousDiseaseRecord {
  id: string;
  childId: string;
  fio: string;
  birthdate: string;
  diagnosis: string;
  date: string;
  group: string;
  quarantine_days: number;
  observation: string;
  notes?: string;
}
