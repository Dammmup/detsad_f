// Полный тип согласно IFoodStaffHealth бэкенда
// Backend-поля опциональны для обратной совместимости с UI
export interface FoodStaffHealth {
    id?: string;
    _id?: string;
    // Backend fields (optional for backward compatibility)
    staffId?: string;
    date?: Date | string;
    medicalCommissionDate?: Date | string;
    medicalCommissionNumber?: string;
    medicalCommissionResult?: string;
    medicalCommissionNotes?: string;
    medicalCommissionAttachments?: string[];
    sanitaryMinimumDate?: Date | string;
    sanitaryMinimumResult?: string;
    sanitaryMinimumNotes?: string;
    sanitaryMinimumAttachments?: string[];
    vaccinationStatus?: 'up_to_date' | 'outdated' | 'not_required';
    vaccinationNotes?: string;
    vaccinationAttachments?: string[];
    healthStatus?: 'healthy' | 'conditionally_healthy' | 'temporarily_unfit' | 'permanently_unfit';
    healthNotes?: string;
    healthAttachments?: string[];
    nextMedicalCommissionDate?: Date | string;
    nextSanitaryMinimumDate?: Date | string;
    nextVaccinationDate?: Date | string;
    doctor?: string;
    notes?: string;
    attachments?: string[];
    status?: 'pending' | 'completed' | 'reviewed';
    recommendations?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    // Legacy UI fields
    staffName?: string;
}
