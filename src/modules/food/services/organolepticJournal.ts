import { OrganolepticRecord } from '../../../shared/types/organoleptic';
import { BaseCrudApiClient, apiClient } from '../../../shared/utils/api';

class OrganolepticJournalApiClient extends BaseCrudApiClient<OrganolepticRecord> {
  endpoint = '/organoleptic-journal';

  async generateByMenu(params: { date: string; group?: string }): Promise<OrganolepticRecord[]> {
    const { data } = await apiClient.post(`${this.endpoint}/generate`, params);
    return data;
  }

  async clearRecords(params: { date: string; group?: string }): Promise<void> {
    await apiClient.delete(`${this.endpoint}/clear`, { params });
  }
}

export const organolepticJournalApi = new OrganolepticJournalApiClient();
export const getOrganolepticRecords = (params?: any) => organolepticJournalApi.getAll(params);
export const createOrganolepticRecord = (data: Partial<OrganolepticRecord>) => organolepticJournalApi.create(data);
export const updateOrganolepticRecord = (id: string, data: Partial<OrganolepticRecord>) => organolepticJournalApi.update(id, data);
export const deleteOrganolepticRecord = (id: string) => organolepticJournalApi.deleteItem(id);
export const generateOrganolepticByMenu = (params: { date: string; group?: string }) => organolepticJournalApi.generateByMenu(params);
export const clearOrganolepticRecords = (params: { date: string; group?: string }) => organolepticJournalApi.clearRecords(params);

export type { OrganolepticRecord };
export default organolepticJournalApi;
