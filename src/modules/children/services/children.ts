import { BaseCrudApiClient, apiClient } from '../../../shared/utils/api';
import { Child, ID } from '../../../shared/types/common';

class ChildrenApiClient extends BaseCrudApiClient<Child> {
  protected endpoint = '/children';

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
export type { Child } from '../../../shared/types/common';
