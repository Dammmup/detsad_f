import { BaseCrudApiClient } from '../utils/api';

export interface FoodStockLog {
  _id?: string;
  date: string;
  product: string;
  quantity: number;
  unit: string;
  responsible: string;
  notes?: string;
}

class FoodStockLogApiClient extends BaseCrudApiClient<FoodStockLog> {
  protected endpoint = '/food-stock-log';
}

export const foodStockLogApi = new FoodStockLogApiClient();
