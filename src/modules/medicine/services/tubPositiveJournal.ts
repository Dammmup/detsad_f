import { TubPositiveRecord } from '../../../shared/types/tubPositive';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class TubPositiveJournalApiClient extends BaseCrudApiClient<TubPositiveRecord> {
  endpoint = '/tub-positive-journal';
}

export const tubPositiveJournalApi = new TubPositiveJournalApiClient();
export const getTubPositiveRecords = (params?: any) => tubPositiveJournalApi.getAll(params);
export const createTubPositiveRecord = (data: Partial<TubPositiveRecord>) => tubPositiveJournalApi.create(data);
export const deleteTubPositiveRecord = (id: string) => tubPositiveJournalApi.deleteItem(id);
export type { TubPositiveRecord };
export default tubPositiveJournalApi;
