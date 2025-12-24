// Полный тип согласно IPerishableBrak бэкенда
// Backend-поля опциональны для обратной совместимости с UI
export interface PerishableBrak {
    id?: string;
    _id?: string;
    // Backend fields (optional for backward compatibility)
    productId?: string;
    productName?: string;
    batchNumber?: string;
    expirationDate?: Date | string;
    quantity?: number;
    unit?: string;
    reason?: string;
    inspector?: string;
    inspectionDate?: Date | string;
    disposalMethod?: string;
    disposalDate?: Date | string;
    disposedBy?: string;
    notes?: string;
    attachments?: string[];
    status?: 'pending' | 'disposed' | 'reviewed';
    createdAt?: Date | string;
    updatedAt?: Date | string;
    // Legacy UI fields
    date?: string;
    product?: string;
    assessment?: string;
    expiry?: string;
}
