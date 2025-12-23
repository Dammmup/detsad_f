import api from './base';

export interface ProductIngredient {
    productId: string;
    quantity: number;
    unit: string;
}

export interface Product {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    category: string;
    unit: string;
    supplier: string;
    price: number;
    stockQuantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    expirationDate?: string;
    batchNumber?: string;
    storageConditions?: string;
    notes?: string;
    status: 'active' | 'inactive' | 'discontinued';
    childCount: number;
    purchaseDays: number;
    purchaseDate: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductAlerts {
    expiring: Product[];
    expired: Product[];
    lowStock: Product[];
    totalAlerts: number;
}

// Получить все продукты
export const getProducts = async (filters?: {
    category?: string;
    status?: string;
    supplier?: string;
    expiringInDays?: number;
    lowStock?: boolean;
}): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplier) params.append('supplier', filters.supplier);
    if (filters?.expiringInDays) params.append('expiringInDays', String(filters.expiringInDays));
    if (filters?.lowStock) params.append('lowStock', 'true');

    const queryString = params.toString();
    const { data } = await api.get(`/products${queryString ? `?${queryString}` : ''}`);
    return data;
};

// Получить продукт по ID
export const getProductById = async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

// Создать продукт
export const createProduct = async (product: Partial<Product>): Promise<Product> => {
    const { data } = await api.post('/products', product);
    return data;
};

// Обновить продукт
export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data } = await api.put(`/products/${id}`, product);
    return data;
};

// Удалить продукт
export const deleteProduct = async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
};

// Получить предупреждения о продуктах
export const getProductAlerts = async (): Promise<ProductAlerts> => {
    const { data } = await api.get('/products/alerts');
    return data;
};

// Получить продукты с истекающим сроком
export const getExpiringProducts = async (days: number = 7): Promise<Product[]> => {
    const { data } = await api.get(`/products/expiring?days=${days}`);
    return data;
};

// Уменьшить запас
export const decreaseStock = async (id: string, quantity: number): Promise<Product> => {
    const { data } = await api.post(`/products/${id}/decrease-stock`, { quantity });
    return data;
};

// Увеличить запас
export const increaseStock = async (id: string, quantity: number): Promise<Product> => {
    const { data } = await api.post(`/products/${id}/increase-stock`, { quantity });
    return data;
};

// Получить категории
export const getProductCategories = async (): Promise<string[]> => {
    const { data } = await api.get('/products/categories');
    return data;
};

// Получить поставщиков
export const getProductSuppliers = async (): Promise<string[]> => {
    const { data } = await api.get('/products/suppliers');
    return data;
};
