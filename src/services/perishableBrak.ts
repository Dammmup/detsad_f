import { BaseCrudApiClient } from '../utils/api';

export interface PerishableBrak {
  _id?: string;
  date: string;
  product: string;
  assessment: string;
  expiry: string;
  notes?: string;
}

class PerishableBrakApiClient extends BaseCrudApiClient<PerishableBrak> {
  protected endpoint = '/perishable-brak';
}

export const perishableBrakApi = new PerishableBrakApiClient();
