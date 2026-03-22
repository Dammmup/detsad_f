export interface VitaminizationRecord {
    _id?: string;
    date: string;
    group: string;
    meal: string;
    dish: string;
    dose: number;
    portions: number;
    nurse: string;
    status: 'Проведено' | 'Не проведено';
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}
