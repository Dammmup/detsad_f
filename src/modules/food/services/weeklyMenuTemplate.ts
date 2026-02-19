import { apiClient as api } from '../../../shared/utils/api';

export interface DayMeals {
    breakfast: any[];
    lunch: any[];
    snack: any[];
    dinner: any[];
}

export interface WeeklyMenuTemplate {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    days: {
        monday: DayMeals;
        tuesday: DayMeals;
        wednesday: DayMeals;
        thursday: DayMeals;
        friday: DayMeals;
        saturday: DayMeals;
        sunday: DayMeals;
    };
    defaultChildCount: number;
    isActive: boolean;
    createdBy?: {
        _id: string;
        fullName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WEEKDAY_NAMES: Record<Weekday, string> = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье'
};

export interface RequiredProduct {
    productId: string;
    name: string;
    required: number;
    available: number;
    shortage: number;
    unit: string;
    sufficient: boolean;
}

export interface ApplyResult {
    createdMenus: any[];
    shortages: RequiredProduct[];
    message: string;
}

// Получить все шаблоны
export const getWeeklyMenuTemplates = async (filters?: { isActive?: boolean }): Promise<WeeklyMenuTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const queryString = params.toString();
    const { data } = await api.get(`/weekly-menu-template${queryString ? `?${queryString}` : ''}`);
    return data;
};

// Получить шаблон по ID
export const getWeeklyMenuTemplateById = async (id: string): Promise<WeeklyMenuTemplate> => {
    const { data } = await api.get(`/weekly-menu-template/${id}`);
    return data;
};

// Создать шаблон
export const createWeeklyMenuTemplate = async (template: Partial<WeeklyMenuTemplate>): Promise<WeeklyMenuTemplate> => {
    const { data } = await api.post('/weekly-menu-template', template);
    return data;
};

// Обновить шаблон
export const updateWeeklyMenuTemplate = async (id: string, template: Partial<WeeklyMenuTemplate>): Promise<WeeklyMenuTemplate> => {
    const { data } = await api.put(`/weekly-menu-template/${id}`, template);
    return data;
};

// Удалить шаблон
export const deleteWeeklyMenuTemplate = async (id: string): Promise<void> => {
    await api.delete(`/weekly-menu-template/${id}`);
};

// Добавить блюдо в день
export const addDishToTemplateDay = async (
    templateId: string,
    day: Weekday,
    mealType: MealType,
    dishId: string
): Promise<WeeklyMenuTemplate> => {
    const { data } = await api.post(`/weekly-menu-template/${templateId}/dish`, { day, mealType, dishId });
    return data;
};

// Удалить блюдо из дня
export const removeDishFromTemplateDay = async (
    templateId: string,
    day: Weekday,
    mealType: MealType,
    dishId: string
): Promise<WeeklyMenuTemplate> => {
    const { data } = await api.delete(`/weekly-menu-template/${templateId}/${day}/${mealType}/${dishId}`);
    return data;
};

// Применить шаблон к неделе
export const applyTemplateToWeek = async (
    templateId: string,
    startDate: string,
    childCount: number
): Promise<ApplyResult> => {
    const { data } = await api.post(`/weekly-menu-template/${templateId}/apply-week`, { startDate, childCount });
    return data;
};

// Применить шаблон к месяцу
export const applyTemplateToMonth = async (
    templateId: string,
    startDate: string,
    childCount: number
): Promise<ApplyResult> => {
    const { data } = await api.post(`/weekly-menu-template/${templateId}/apply-month`, { startDate, childCount });
    return data;
};

// Рассчитать требуемые продукты
export const calculateRequiredProducts = async (
    templateId: string,
    days: number,
    childCount: number
): Promise<RequiredProduct[]> => {
    const { data } = await api.get(`/weekly-menu-template/${templateId}/required-products?days=${days}&childCount=${childCount}`);
    return data;
};
