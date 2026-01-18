import { DetergentLogRecord } from '../../../shared/types/detergentLog';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class DetergentLogApiClient extends BaseCrudApiClient<DetergentLogRecord> {
  endpoint = '/detergent-log';
}

export const detergentLogApi = new DetergentLogApiClient();
export const getDetergentRecords = (params?: any) => detergentLogApi.getAll(params);
export const createDetergentRecord = (data: Partial<DetergentLogRecord>) => detergentLogApi.create(data);
export const deleteDetergentRecord = (id: string) => detergentLogApi.deleteItem(id);
export type { DetergentLogRecord };
export default detergentLogApi;
