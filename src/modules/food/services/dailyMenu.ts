import { apiClient as api } from '../../../shared/utils/api';

export interface Meal {
    dishes: any[];
    servedAt?: string;
    childCount: number;
}

export interface ConsumptionLog {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    consumedAt: string;
}

export interface DailyMenu {
    _id?: string;
    id?: string;
    date: string;
    meals: {
        breakfast: Meal;
        lunch: Meal;
        dinner: Meal;
        snack: Meal;
    };
    totalChildCount: number;
    consumptionLogs: ConsumptionLog[];
    notes?: string;
    createdBy?: {
        _id: string;
        fullName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Получить все меню
export const getDailyMenus = async (filters?: {
    startDate?: string;
    endDate?: string;
}): Promise<DailyMenu[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const { data } = await api.get(`/daily-menu${queryString ? `?${queryString}` : ''}`);
    return data;
};

// Получить меню по ID
export const getDailyMenuById = async (id: string): Promise<DailyMenu> => {
    const { data } = await api.get(`/daily-menu/${id}`);
    return data;
};

// Получить меню на сегодня
export const getTodayMenu = async (): Promise<DailyMenu | null> => {
    const { data } = await api.get('/daily-menu/today');
    return data;
};

// Получить меню по дате
export const getDailyMenuByDate = async (date: string): Promise<DailyMenu> => {
    const { data } = await api.get(`/daily-menu/date/${date}`);
    return data;
};

// Создать меню
export const createDailyMenu = async (menu: Partial<DailyMenu>): Promise<DailyMenu> => {
    const { data } = await api.post('/daily-menu', menu);
    return data;
};

// Обновить меню
export const updateDailyMenu = async (id: string, menu: Partial<DailyMenu>): Promise<DailyMenu> => {
    const { data } = await api.put(`/daily-menu/${id}`, menu);
    return data;
};

// Удалить меню
export const deleteDailyMenu = async (id: string): Promise<void> => {
    await api.delete(`/daily-menu/${id}`);
};

// Подать приём пищи (списание продуктов)
export const serveMeal = async (menuId: string, mealType: MealType, childCount: number): Promise<DailyMenu> => {
    const { data } = await api.post(`/daily-menu/${menuId}/serve/${mealType}`, { childCount });
    return data;
};

// Отменить подачу
export const cancelMeal = async (menuId: string, mealType: MealType): Promise<DailyMenu> => {
    const { data } = await api.post(`/daily-menu/${menuId}/cancel/${mealType}`);
    return data;
};

// Добавить блюдо в приём пищи
export const addDishToMeal = async (menuId: string, mealType: MealType, dishId: string): Promise<DailyMenu> => {
    const { data } = await api.post(`/daily-menu/${menuId}/meal/${mealType}/dish`, { dishId });
    return data;
};

// Удалить блюдо из приёма пищи
export const removeDishFromMeal = async (menuId: string, mealType: MealType, dishId: string): Promise<DailyMenu> => {
    const { data } = await api.delete(`/daily-menu/${menuId}/meal/${mealType}/dish/${dishId}`);
    return data;
};

// Получить названия приёмов пищи
export const getMealTypeName = (mealType: MealType): string => {
    const names: Record<MealType, string> = {
        breakfast: 'Завтрак',
        lunch: 'Обед',
        dinner: 'Ужин',
        snack: 'Полдник'
    };
    return names[mealType];
};
