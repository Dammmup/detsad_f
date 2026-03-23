import { apiClient as api } from '../../../shared/utils/api';
import { ProductIngredient } from './products';

export interface Dish {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    subcategory?: 'soup' | 'main' | 'porridge' | 'salad' | 'drink' | 'baking' | 'garnish' | 'other';
    ingredients: {
        productId: string | { _id: string; name: string; unit: string };
        grossQuantity?: number;
        quantity: number; // нетто
        producedQuantity?: number;
        unit: string;
    }[];
    servingsCount: number;
    preparationTime?: number;
    isActive: boolean;
    createdBy?: {
        _id: string;
        fullName: string;
    };
    createdAt?: string;
    updatedAt?: string;

    // Поля для техкарты
    recipeNumber?: string;
    recipeSource?: string;
    technologicalProcess?: string;
    shelfLifeAndStorage?: string;
    yield?: number;
    yield1kg?: number;
    nutritionalInfo?: {
        calories?: number;
        proteins?: number;
        fats?: number;
        carbs?: number;
    };
    organoleptic?: {
        appearance?: string;
        consistency?: string;
        color?: string;
        tasteAndSmell?: string;
    };
    vitaminsAndMinerals?: {
        A?: number;
        D?: number;
        E?: number;
        K?: number;
        C?: number;
        dietaryFiber?: number;
    };
}

export interface DishAvailability {
    available: boolean;
    missing: {
        productId: string;
        productName: string;
        required: number;
        available: number;
        unit: string;
    }[];
}

// Получить все блюда
export const getDishes = async (filters?: {
    category?: string;
    subcategory?: string;
    isActive?: boolean;
}): Promise<Dish[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.subcategory && filters.subcategory !== 'all') params.append('subcategory', filters.subcategory);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const queryString = params.toString();
    const { data } = await api.get(`/dishes${queryString ? `?${queryString}` : ''}`);
    return data;
};

// Получить блюдо по ID
export const getDishById = async (id: string): Promise<Dish> => {
    const { data } = await api.get(`/dishes/${id}`);
    return data;
};

// Создать блюдо
export const createDish = async (dish: Partial<Dish>): Promise<Dish> => {
    const { data } = await api.post('/dishes', dish);
    return data;
};

// Обновить блюдо
export const updateDish = async (id: string, dish: Partial<Dish>): Promise<Dish> => {
    const { data } = await api.put(`/dishes/${id}`, dish);
    return data;
};

// Удалить блюдо
export const deleteDish = async (id: string): Promise<void> => {
    await api.delete(`/dishes/${id}`);
};

// Получить блюда по категории
export const getDishesByCategory = async (category: string): Promise<Dish[]> => {
    const { data } = await api.get(`/dishes/category/${category}`);
    return data;
};

// Переключить активность
export const toggleDishActive = async (id: string): Promise<Dish> => {
    const { data } = await api.patch(`/dishes/${id}/toggle`);
    return data;
};

// Получить стоимость блюда
export const getDishCost = async (id: string): Promise<{ cost: number }> => {
    const { data } = await api.get(`/dishes/${id}/cost`);
    return data;
};

// Проверить доступность ингредиентов
export const checkDishAvailability = async (id: string, servings: number = 1): Promise<DishAvailability> => {
    const { data } = await api.get(`/dishes/${id}/availability?servings=${servings}`);
    return data;
};

// Анализ PDF с технологическими картами через AI
export interface PdfAnalysisResult {
    success: boolean;
    totalParsed: number;
    existing: {
        dish: { _id: string; name: string; recipeNumber?: string; category: string };
        updates: Record<string, { old: any; new: any }>;
        parsedData: any;
    }[];
    newDishes: any[];
    message: string;
}

export const analyzePdf = async (file: File): Promise<PdfAnalysisResult> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const { data } = await api.post('/dishes/analyze-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000 // 10 минут — AI может долго обрабатывать
    });
    return data;
};

// Подтверждение импорта из PDF
export interface PdfImportResult {
    success: boolean;
    matched: number;
    modified: number;
    message: string;
}

export const confirmPdfImport = async (updates: { dishId: string; parsedData: any }[]): Promise<PdfImportResult> => {
    const { data } = await api.post('/dishes/confirm-pdf-import', { updates });
    return data;
};
