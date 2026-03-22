import { apiClient as api } from '../../../shared/utils/api';

const BASE = '/accounting';

export interface IAccount {
  _id: string;
  code: string;
  name: string;
  type: 'active' | 'passive' | 'active-passive';
  parentCode?: string;
  isGroup: boolean;
  description?: string;
  isActive: boolean;
}

export interface IAccountingDocument {
  _id: string;
  type: string;
  number: string;
  date: string;
  description: string;
  status: 'draft' | 'posted' | 'reversed';
  sourceEntity?: string;
  sourceId?: string;
  fiscalYear: number;
  fiscalMonth: number;
  totalDebit: number;
  totalCredit: number;
  postedAt?: string;
  createdAt: string;
}

export interface IPosting {
  _id: string;
  documentId: any;
  lineNumber: number;
  debitAccountCode: string;
  creditAccountCode: string;
  amount: number;
  date: string;
  description: string;
  counterpartyId?: string;
  counterpartyType?: string;
  syncedToSupabase: boolean;
}

export interface ITrialBalanceRow {
  code: string;
  name: string;
  type: string;
  openingBalance: number;
  debitTurnover: number;
  creditTurnover: number;
  closingBalance: number;
}

export interface ITrialBalanceResponse {
  from: string;
  to: string;
  rows: ITrialBalanceRow[];
  totals: { debit: number; credit: number };
}

export interface IAccountCardEntry {
  date: string;
  documentNumber: string;
  documentType: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  isDebit: boolean;
  isCredit: boolean;
}

export interface IAccountReport {
  account: { code: string; name: string; type: string };
  from: string;
  to: string;
  balance: number;
  turnover: { debit: number; credit: number };
  entries: IAccountCardEntry[];
}

export interface IPnLReport {
  from: string;
  to: string;
  income: number;
  expenses: number;
  profit: number;
  expenseDetails: { accountCode: string; total: number }[];
  incomeDetails: { accountCode: string; total: number }[];
}

export interface ISyncStatus {
  supabaseConfigured: boolean;
  unsyncedCount: number;
  lastSyncedAt: string | null;
  queueSize: number;
}

const accountingApi = {
  // Accounts
  getAccounts: async (): Promise<IAccount[]> => {
    const { data } = await api.get(`${BASE}/accounts`);
    return data;
  },

  // Documents
  getDocuments: async (filters?: Record<string, string>): Promise<IAccountingDocument[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    }
    const url = params.toString() ? `${BASE}/documents?${params}` : `${BASE}/documents`;
    const { data } = await api.get(url);
    return data;
  },

  createDocument: async (docData: any): Promise<IAccountingDocument> => {
    const { data } = await api.post(`${BASE}/documents`, docData);
    return data;
  },

  reverseDocument: async (id: string, reason: string): Promise<IAccountingDocument> => {
    const { data } = await api.post(`${BASE}/documents/${id}/reverse`, { reason });
    return data;
  },

  // Postings
  getPostings: async (filters?: Record<string, string>): Promise<IPosting[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    }
    const url = params.toString() ? `${BASE}/postings?${params}` : `${BASE}/postings`;
    const { data } = await api.get(url);
    return data;
  },

  // Reports
  getTrialBalance: async (from: string, to: string): Promise<ITrialBalanceResponse> => {
    const { data } = await api.get(`${BASE}/reports/balance?from=${from}&to=${to}`);
    return data;
  },

  getPnL: async (from: string, to: string): Promise<IPnLReport> => {
    const { data } = await api.get(`${BASE}/reports/pnl?from=${from}&to=${to}`);
    return data;
  },

  getAccountCard: async (code: string, from: string, to: string): Promise<IAccountReport> => {
    const { data } = await api.get(`${BASE}/reports/account/${code}?from=${from}&to=${to}`);
    return data;
  },

  // Sync
  getSyncStatus: async (): Promise<ISyncStatus> => {
    const { data } = await api.get(`${BASE}/sync/status`);
    return data;
  },

  triggerSync: async (): Promise<{ message: string }> => {
    const { data } = await api.post(`${BASE}/sync/trigger`);
    return data;
  },

  // Seed
  seedAccounts: async (): Promise<{ message: string }> => {
    const { data } = await api.post(`${BASE}/seed`);
    return data;
  },

  // Ретроспективная генерация проводок из существующих данных
  retroGenerate: async (): Promise<{ message: string; generated: any; total: number }> => {
    const { data } = await api.post(`${BASE}/retro-generate`);
    return data;
  },
};

export default accountingApi;
