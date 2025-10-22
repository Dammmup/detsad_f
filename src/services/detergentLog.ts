
import { BaseCrudApiClient } from '../utils/api';

export interface DetergentLog {
  _id?: string;
  date: string;
  detergent: string;
  quantity: number;
  responsible: string;
  notes?: string;
}

class DetergentLogApiClient extends BaseCrudApiClient<DetergentLog> {
  protected endpoint = '/detergent-log';
}

export const detergentLogApi = new DetergentLogApiClient();
