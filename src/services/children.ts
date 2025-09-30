import { BaseCrudApiClient, apiCache } from '../utils/api';
import { Child, ID } from '../types/common';

/**
 * API клиент для работы с детьми
 */
class ChildrenApiClient extends BaseCrudApiClient<Child> {
  protected endpoint = '/children';
  private readonly CACHE_KEY = 'children';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  /**
   * Получение всех детей с кэшированием
   */
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
}

const childrenApi = new ChildrenApiClient();
export default childrenApi;
export type { Child } from '../types/common';
