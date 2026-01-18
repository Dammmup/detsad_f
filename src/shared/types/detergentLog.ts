// Полный тип согласно IDetergentLog бэкенда
// Backend-поля опциональны для обратной совместимости с UI
export interface DetergentLogRecord {
    id?: string;
    _id?: string;
    // Backend fields (optional for backward compatibility)
    productId?: string;
    productName?: string;
    batchNumber?: string;
    expirationDate?: Date | string;
    quantity?: number;
    unit?: string;
    supplier?: string;
    supplierContact?: string;
    deliveryDate?: Date | string;
    deliveryPerson?: string;
    receiver?: string;
    notes?: string;
    attachments?: string[];
    status?: 'received' | 'stored' | 'used' | 'disposed';
    usageDate?: Date | string;
    usagePerson?: string;
    disposalDate?: Date | string;
    disposalMethod?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    // Legacy UI fields
    date?: string;
    detergent?: string;
    responsible?: string;
}
