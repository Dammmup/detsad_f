export interface SomaticRecord {
  id: string;
  childId: string;
  fio: string;
  birthdate: string;
  fromDate: string;
  toDate: string;
  diagnosis: string;
  date: string;
  notes?: string;
  days?: number;
  address: string;
}
