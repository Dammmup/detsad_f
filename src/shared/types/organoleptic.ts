export interface OrganolepticRecord {
    id: string;
    _id?: string;
    date: Date | string;
    dish: string; // Changed from dishName back to dish
    group?: string; // Added back
    appearance: number;
    smell: number;
    taste: number;
    decision?: string; // Added back
    responsible: string;
    notes?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
