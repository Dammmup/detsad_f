import { ContactInfectionRecord } from '../../../shared/types/contactInfection';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class ContactInfectionJournalApiClient extends BaseCrudApiClient<ContactInfectionRecord> {
  endpoint = '/contact-infection-journal';
}

export const contactInfectionJournalApi = new ContactInfectionJournalApiClient();
export const getContactRecords = (params?: any) => contactInfectionJournalApi.getAll(params);
export const createContactRecord = (data: Partial<ContactInfectionRecord>) => contactInfectionJournalApi.create(data);
export const deleteContactRecord = (id: string) => contactInfectionJournalApi.deleteItem(id);
export type { ContactInfectionRecord };
export default contactInfectionJournalApi;
