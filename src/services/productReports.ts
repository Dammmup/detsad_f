import api from './base';

export interface ConsumptionReportItem {
    productId: string;
    productName: string;
    category: string;
    totalConsumed: number;
    unit: string;
    byMealType: {
        breakfast: number;
        lunch: number;
        snack: number;
        dinner: number;
    };
}

export interface DailyConsumption {
    date: string;
    totalChildCount: number;
    products: {
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
        mealType: string;
    }[];
    meals: {
        breakfast: { served: boolean; childCount: number };
        lunch: { served: boolean; childCount: number };
        snack: { served: boolean; childCount: number };
        dinner: { served: boolean; childCount: number };
    };
}

export interface ProductStats {
    product: {
        id: string;
        name: string;
        category: string;
        unit: string;
        currentStock: number;
        minStockLevel: number;
        expirationDate?: string;
    };
    period: { startDate: string; endDate: string };
    consumption: {
        total: number;
        byMealType: { breakfast: number; lunch: number; snack: number; dinner: number };
        daily: { date: string; quantity: number }[];
    };
    purchases: {
        total: number;
        count: number;
    };
    averageDailyConsumption: number;
}

export interface SummaryReport {
    period: { startDate: string; endDate: string };
    stockStatus: {
        totalProducts: number;
        lowStock: number;
        expiringSoon: number;
        expired: number;
    };
    consumption: {
        totalProducts: number;
        byCategory: { [key: string]: number };
        topConsumed: ConsumptionReportItem[];
    };
    alerts: {
        lowStockProducts: { id: string; name: string; stock: number; min: number }[];
        expiringProducts: { id: string; name: string; expirationDate: string }[];
        expiredProducts: { id: string; name: string; expirationDate: string }[];
    };
}

// Отчёт по расходу за период
export const getConsumptionReport = async (startDate: string, endDate: string): Promise<ConsumptionReportItem[]> => {
    const { data } = await api.get(`/product-reports/consumption?startDate=${startDate}&endDate=${endDate}`);
    return data;
};

// Расход за день
export const getDailyConsumption = async (date: string): Promise<DailyConsumption> => {
    const { data } = await api.get(`/product-reports/daily/${date}`);
    return data;
};

// Статистика по продукту
export const getProductStats = async (productId: string, startDate: string, endDate: string): Promise<ProductStats> => {
    const { data } = await api.get(`/product-reports/product/${productId}?startDate=${startDate}&endDate=${endDate}`);
    return data;
};

// Сводный отчёт (дашборд)
export const getSummaryReport = async (startDate: string, endDate: string): Promise<SummaryReport> => {
    const { data } = await api.get(`/product-reports/summary?startDate=${startDate}&endDate=${endDate}`);
    return data;
};
