import { BaseCrudApiClient } from '../utils/api';
import { DetergentLog } from '../types/detergentLog';
export type { DetergentLog } from '../types/detergentLog';

class DetergentLogApiClient extends BaseCrudApiClient<DetergentLog> {
  protected endpoint = '/detergent-log';
}

export const detergentLogApi = new DetergentLogApiClient();
