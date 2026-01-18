// Полный тип согласно IProductCertificate бэкенда
// Backend-поля опциональны для обратной совместимости с UI
export interface ProductCertificate {
    id?: string;
    _id?: string;
    // Backend fields (optional for backward compatibility)
    productId?: string;
    productName?: string;
    certificateNumber?: string;
    issueDate?: Date | string;
    expiryDate?: Date | string;
    issuer?: string;
    issuerAddress?: string;
    issuerContact?: string;
    productDescription?: string;
    productCategory?: string;
    manufacturingDate?: Date | string;
    batchNumber?: string;
    quantity?: number;
    unit?: string;
    qualityStandards?: string[];
    testingResults?: string;
    inspector?: string;
    inspectionDate?: Date | string;
    notes?: string;
    attachments?: string[];
    status?: 'pending' | 'approved' | 'rejected' | 'expired';
    rejectionReason?: string;
    approvedBy?: string;
    approvedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    // Legacy UI fields
    date?: string;
    product?: string;
    issuedBy?: string;
    expiry?: string;
}
