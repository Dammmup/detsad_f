import { HealthPassportRecord } from '../../../shared/types/healthPassport';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class HealthPassportApiClient extends BaseCrudApiClient<HealthPassportRecord> {
  endpoint = '/health-passport';
}

export const healthPassportApi = new HealthPassportApiClient();
export const getHealthPassportRecords = (params?: any) => healthPassportApi.getAll(params);
export const createHealthPassportRecord = (data: Partial<HealthPassportRecord>) => healthPassportApi.create(data);
export const deleteHealthPassportRecord = (id: string) => healthPassportApi.deleteItem(id);
export type { HealthPassportRecord };
export default healthPassportApi;
