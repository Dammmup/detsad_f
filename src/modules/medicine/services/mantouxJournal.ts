import { MantouxRecord } from '../../../shared/types/mantoux';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class MantouxJournalApiClient extends BaseCrudApiClient<MantouxRecord> {
  endpoint = '/mantoux-journal';
}

export const mantouxJournalApi = new MantouxJournalApiClient();
export const getMantouxRecords = (params?: any) => mantouxJournalApi.getAll(params);
export const createMantouxRecord = (data: Partial<MantouxRecord>) => mantouxJournalApi.create(data);
export const deleteMantouxRecord = (id: string) => mantouxJournalApi.deleteItem(id);
export type { MantouxRecord };
export default mantouxJournalApi;
