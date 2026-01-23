import { HelminthRecord } from '../../../shared/types/helminth';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class HelminthJournalApiClient extends BaseCrudApiClient<HelminthRecord> {
  endpoint = '/helminth-journal';
}

export const helminthJournalApi = new HelminthJournalApiClient();
export const getHelminthRecords = (params?: any) => helminthJournalApi.getAll(params);
export const createHelminthRecord = (data: Partial<HelminthRecord>) => helminthJournalApi.create(data);
export const deleteHelminthRecord = (id: string) => helminthJournalApi.deleteItem(id);
export type { HelminthRecord };
export default helminthJournalApi;
