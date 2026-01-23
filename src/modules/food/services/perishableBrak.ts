import { BaseCrudApiClient } from '../../../shared/utils/api';
import { PerishableBrak } from '../types/perishableBrak';
export type { PerishableBrak } from '../types/perishableBrak';

class PerishableBrakApiClient extends BaseCrudApiClient<PerishableBrak> {
  protected endpoint = '/perishable-brak';
}

export const perishableBrakApi = new PerishableBrakApiClient();
