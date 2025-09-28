export interface MenuItem {
  _id?: string;
  name: string;
  meal: string;
  group: string;
  vitaminDose: number;
  defaultPortion: number;
  unit: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
