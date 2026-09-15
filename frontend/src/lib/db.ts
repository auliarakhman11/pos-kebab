import Dexie, { Table } from 'dexie';

export interface OfflineTransaction {
  id?: number;
  payload_data: any;
  created_at: string;
  status: 'pending' | 'syncing' | 'failed';
}

export class PosKebabDatabase extends Dexie {
  offline_transactions!: Table<OfflineTransaction, number>;

  constructor() {
    super('PosKebabDB');
    this.version(1).stores({
      offline_transactions: '++id, created_at, status',
    });
  }
}

export const db = new PosKebabDatabase();
