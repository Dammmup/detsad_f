export interface HelminthRecord {
  id: string;
  childId: string;
  fio: string;
  birthdate: string;
  address: string;
  month: string;
  year: string;
  examType: 'primary' | 'annual';
  result: 'positive' | 'negative';
  notes?: string;
}
