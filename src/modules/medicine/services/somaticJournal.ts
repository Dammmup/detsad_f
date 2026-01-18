import { SomaticRecord } from '../../../shared/types/somatic';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class SomaticJournalApiClient extends BaseCrudApiClient<SomaticRecord> {
  endpoint = '/somatic-journal';
}

export const somaticJournalApi = new SomaticJournalApiClient();
export const getSomaticRecords = (params?: any) => somaticJournalApi.getAll(params);
export const createSomaticRecord = (data: Partial<SomaticRecord>) => somaticJournalApi.create(data);
export const deleteSomaticRecord = (id: string) => somaticJournalApi.deleteItem(id);
export const updateSomaticRecord = (id: string, data: Partial<SomaticRecord>) => somaticJournalApi.update(id, data);
export type { SomaticRecord };
export default somaticJournalApi;
