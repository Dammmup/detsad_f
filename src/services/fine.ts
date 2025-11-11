import { BaseCrudApiClient } from '../utils/api';
interface Fine {
  _id: string;
  staffId: string;
  date: string;
  amount: number;
  reason: string;
  createdAt?: string;
  updatedAt?: string;
}

class FineApiClient extends BaseCrudApiClient<Fine> {
  protected endpoint = '/fine';

  async getAllByMonth(month: string): Promise<Fine[]> {
    return this.getAll({ month });
  }

  async getByStaffAndMonth(staffId: string, month: string): Promise<Fine[]> {
    return this.getAll({ staffId, month });
  }
}

const fineApi = new FineApiClient();
export default fineApi;
export { Fine, FineApiClient };
