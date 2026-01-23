import { FineRecord } from '../../../shared/types/staff';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class FineApiClient extends BaseCrudApiClient<FineRecord> {
  endpoint = '/fine';

  async getAllByMonth(month: string): Promise<FineRecord[]> {
    return this.getAll({ month });
  }

  async getByStaffAndMonth(staffId: string, month: string): Promise<FineRecord[]> {
    return this.getAll({ staffId, month });
  }
}

export const fineApi = new FineApiClient();
export const getFines = (params?: any) => fineApi.getAll(params);
export const createFine = (data: Partial<FineRecord>) => fineApi.create(data);
export const updateFine = (id: string, data: Partial<FineRecord>) => fineApi.update(id, data);
export const deleteFine = (id: string) => fineApi.deleteItem(id);

export default fineApi;
