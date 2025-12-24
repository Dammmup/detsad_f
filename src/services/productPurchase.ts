import api from './base';

export interface ProductPurchase {
    _id?: string;
    id?: string;
    productId: string | {
        _id: string;
        name: string;
        category: string;
        unit: string;
        weight?: number;
        weightUnit?: 'г' | 'кг' | 'мл' | 'л';
    };
    quantity: number;
    unit: string;
    weight?: number; // Вес единицы продукта
    weightUnit?: 'г' | 'кг' | 'мл' | 'л';
    pricePerUnit: number;
    totalPrice: number;
    supplier: string;
    batchNumber?: string;
    expirationDate?: string;
    purchaseDate: string;
    invoiceNumber?: string;
    notes?: string;
    createdBy?: {
        _id: string;
        fullName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface PurchaseStats {
    totalAmount: number;
    totalItems: number;
    byCategory: { [key: string]: number };
    byProduct: { name: string; total: number; quantity: number }[];
}

// Получить все закупки
export const getProductPurchases = async (filters?: {
    productId?: string;
    startDate?: string;
    endDate?: string;
    supplier?: string;
}): Promise<ProductPurchase[]> => {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.supplier) params.append('supplier', filters.supplier);

    const queryString = params.toString();
    const { data } = await api.get(`/product-purchases${queryString ? `?${queryString}` : ''}`);
    return data;
};

// Получить закупку по ID
export const getProductPurchaseById = async (id: string): Promise<ProductPurchase> => {
    const { data } = await api.get(`/product-purchases/${id}`);
    return data;
};

// Создать закупку
export const createProductPurchase = async (purchase: Partial<ProductPurchase>): Promise<ProductPurchase> => {
    const { data } = await api.post('/product-purchases', purchase);
    return data;
};

// Удалить закупку
export const deleteProductPurchase = async (id: string): Promise<void> => {
    await api.delete(`/product-purchases/${id}`);
};

// История закупок по продукту
export const getProductPurchaseHistory = async (productId: string, limit?: number): Promise<ProductPurchase[]> => {
    const { data } = await api.get(`/product-purchases/product/${productId}/history${limit ? `?limit=${limit}` : ''}`);
    return data;
};

// Статистика закупок
export const getPurchaseStats = async (startDate: string, endDate: string): Promise<PurchaseStats> => {
    const { data } = await api.get(`/product-purchases/stats?startDate=${startDate}&endDate=${endDate}`);
    return data;
};

// Получить список поставщиков
export const getSuppliers = async (): Promise<string[]> => {
    const { data } = await api.get('/product-purchases/suppliers');
    return data;
};
