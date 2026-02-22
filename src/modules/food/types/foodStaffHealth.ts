// Ежедневный журнал осмотра сотрудников пищеблока (СанПиН)
export interface FoodStaffDailyLog {
    id?: string;
    _id?: string;
    staffId: string;
    date: string | Date;
    hasPustularDiseases: boolean;
    hasAnginaSymptoms: boolean;
    familyHealthy: boolean;
    healthStatus: 'healthy' | 'unfit';
    signature: boolean;
    notes?: string;
    doctor: string;
    createdAt?: string;
    updatedAt?: string;
    // UI helper
    staffName?: string;
}

// Тип для медицинских книжек сотрудников (Legacy/Medical cards)
export interface FoodStaffHealth {
    id?: string;
    _id?: string;
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
    staffName?: string;
}
