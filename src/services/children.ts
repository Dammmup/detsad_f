import { BaseCrudApiClient, apiCache, apiClient } from '../utils/api';
import { Child, ID } from '../types/common';

class ChildrenApiClient extends BaseCrudApiClient<Child> {
  protected endpoint = '/children';
  private readonly CACHE_KEY = 'children';
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  async getAll(): Promise<Child[]> {
    const cacheKey = this.CACHE_KEY;
    const cached = apiCache.get<Child[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const children = await super.getAll();
    apiCache.set(cacheKey, children, this.CACHE_DURATION);
    return children;
  }

  async create(childData: Partial<Child>): Promise<Child> {
    const child = await super.create(childData);
    this.clearCache();
    return child;
  }

  async update(id: ID, childData: Partial<Child>): Promise<Child> {
    const child = await super.update(id, childData);
    this.clearCache();
    return child;
  }

  async deleteItem(id: ID): Promise<void> {
    await super.deleteItem(id);
    this.clearCache();
  }

  clearCache() {
    apiCache.delete(this.CACHE_KEY);
  }

  /**
   * Генерация недостающих платежей для детей
   * @param date - опциональная дата для генерации за определенный месяц
   */
  async generatePayments(date?: Date): Promise<{
    success: boolean;
    message: string;
    stats: { created: number; skipped: number; errors: number };
    errors?: string[];
  }> {
    const response = await apiClient.post(`${this.endpoint}/generate-payments`, {
      date: date?.toISOString(),
    });
    return response.data;
  }
}

const childrenApi = new ChildrenApiClient();
export default childrenApi;
export type { Child } from '../types/common';
