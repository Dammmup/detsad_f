import { InfectiousDiseaseRecord } from '../../../shared/types/infectiousDisease';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class InfectiousDiseasesJournalApiClient extends BaseCrudApiClient<InfectiousDiseaseRecord> {
  endpoint = '/infectious-diseases-journal';
}

export const infectiousDiseasesJournalApi = new InfectiousDiseasesJournalApiClient();
export const getInfectiousDiseaseRecords = (params?: any) => infectiousDiseasesJournalApi.getAll(params);
export const createInfectiousDiseaseRecord = (data: Partial<InfectiousDiseaseRecord>) => infectiousDiseasesJournalApi.create(data);
export const deleteInfectiousDiseaseRecord = (id: string) => infectiousDiseasesJournalApi.deleteItem(id);
export type { InfectiousDiseaseRecord };
export default infectiousDiseasesJournalApi;
