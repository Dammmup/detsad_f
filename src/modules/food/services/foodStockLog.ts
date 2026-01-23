import { BaseCrudApiClient } from '../../../shared/utils/api';
import { FoodStockLog } from '../types/foodStockLog';
export type { FoodStockLog } from '../types/foodStockLog';

class FoodStockLogApiClient extends BaseCrudApiClient<FoodStockLog> {
  protected endpoint = '/food-stock-log';
}

export const foodStockLogApi = new FoodStockLogApiClient();
