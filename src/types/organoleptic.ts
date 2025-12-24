// Полный тип согласно IOrganolepticJournal бэкенда
// Backend-поля опциональны для обратной совместимости с UI
export interface OrganolepticRecord {
  id?: string;
  _id?: string;
  // Backend fields (optional for backward compatibility)
  childId?: string;
  date?: Date | string;
  productName?: string;
  appearance?: string;
  color?: string;
  smell?: string;
  taste?: string;
  temperature?: number;
  consistency?: string;
  packagingCondition?: string;
  expirationDate?: Date | string;
  batchNumber?: string;
  supplier?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  attachments?: string[];
  status?: 'pending' | 'completed' | 'reviewed';
  nextInspectionDate?: Date | string;
  recommendations?: string;
  inspector?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Legacy UI fields
  dish?: string;
  group?: string;
  decision?: string;
  responsibleSignature?: string;
}
