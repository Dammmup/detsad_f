export interface MantouxRecord {
  id: string;
  childId: string;
  fio: string;
  address: string;
  birthdate: string;
  year: string;
  atr: string;
  diagnosis: string;
  mm: number;
  has063: boolean;
  reactionSize: number;
  reactionType: 'negative' | 'positive' | 'hyperergic';
  injectionSite: string;
}
