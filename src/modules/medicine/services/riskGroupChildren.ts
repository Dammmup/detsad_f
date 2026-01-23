import { RiskGroupChildRecord } from '../../../shared/types/riskGroupChild';
import { BaseCrudApiClient } from '../../../shared/utils/api';

class RiskGroupChildrenApiClient extends BaseCrudApiClient<RiskGroupChildRecord> {
  endpoint = '/risk-group-children';
}

export const riskGroupChildrenApi = new RiskGroupChildrenApiClient();
export const getRiskGroupRecords = (params?: any) => riskGroupChildrenApi.getAll(params);
export const createRiskGroupRecord = (data: Partial<RiskGroupChildRecord>) => riskGroupChildrenApi.create(data);
export const deleteRiskGroupRecord = (id: string) => riskGroupChildrenApi.deleteItem(id);
// Aliases for backward compatibility
export const getRiskGroupChildren = getRiskGroupRecords;
export const createRiskGroupChild = createRiskGroupRecord;
export const deleteRiskGroupChild = deleteRiskGroupRecord;
export type { RiskGroupChildRecord };
export default riskGroupChildrenApi;
