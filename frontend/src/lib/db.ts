import Dexie, { Table } from 'dexie';

export interface OfflineCapture {
  id?: number;
  imageBlob: Blob;
  status: 'pending' | 'syncing' | 'failed';
  createdAt: string;
}

export class ClimitraDB extends Dexie {
  captures!: Table<OfflineCapture, number>;

  constructor() {
    super('ClimitraEvidenceDB');
    this.version(1).stores({
      captures: '++id, status, createdAt'
    });
  }
}

export const db = new ClimitraDB();
