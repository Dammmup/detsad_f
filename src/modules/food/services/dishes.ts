import api from '../../../shared/services/base';
import { ProductIngredient } from './products';

export interface Dish {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: ProductIngredient[];
    servingsCount: number;
    preparationTime?: number;
    isActive: boolean;
    createdBy?: {
        _id: string;
        fullName: string;
    };
    createdAt?: string;
    updatedAt?: string;
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
    isActive?: boolean;
}): Promise<Dish[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
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
