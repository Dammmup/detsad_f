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
  days?: number; // e.g., "Mon, Wed, Fri"
  address: string;
}
