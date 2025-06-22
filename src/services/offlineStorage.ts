import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ProofRecord } from '../contexts/AppContext';
import { VerificationReport } from '../types/verification';

interface OfflineDB extends DBSchema {
  pendingUploads: {
    key: string;
    value: {
      id: string;
      file: File;
      metadata: {
        fileName: string;
        fileType: string;
        fileSize: number;
        timestamp: Date;
        location?: { lat: number; lng: number };
        description?: string;
      };
      status: 'pending' | 'syncing' | 'synced' | 'failed';
      createdAt: Date;
      retryCount: number;
    };
  };
  syncedProofs: {
    key: string;
    value: ProofRecord & { verificationReport?: VerificationReport };
  };
  voiceMessages: {
    key: string;
    value: {
      id: string;
      audioBlob: Blob;
      threadId: string;
      transcription?: string;
      aiEnhanced?: string;
      timestamp: Date;
      status: 'pending' | 'processed' | 'failed';
    };
  };
}

class OfflineStorageService {
  private db: IDBPDatabase<OfflineDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<OfflineDB>('ProofVaultOffline', 1, {
      upgrade(db) {
        // Pending uploads store
        if (!db.objectStoreNames.contains('pendingUploads')) {
          db.createObjectStore('pendingUploads', { keyPath: 'id' });
        }
        
        // Synced proofs cache
        if (!db.objectStoreNames.contains('syncedProofs')) {
          db.createObjectStore('syncedProofs', { keyPath: 'id' });
        }
        
        // Voice messages store
        if (!db.objectStoreNames.contains('voiceMessages')) {
          db.createObjectStore('voiceMessages', { keyPath: 'id' });
        }
      },
    });
  }

  async storePendingUpload(
    file: File,
    metadata: {
      fileName: string;
      fileType: string;
      fileSize: number;
      timestamp: Date;
      location?: { lat: number; lng: number };
      description?: string;
    }
  ): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const pendingUpload = {
      id,
      file,
      metadata,
      status: 'pending' as const,
      createdAt: new Date(),
      retryCount: 0,
    };
    
    await this.db!.add('pendingUploads', pendingUpload);
    return id;
  }

  async getPendingUploads() {
    if (!this.db) await this.init();
    return await this.db!.getAll('pendingUploads');
  }

  async updateUploadStatus(id: string, status: 'pending' | 'syncing' | 'synced' | 'failed') {
    if (!this.db) await this.init();
    
    const upload = await this.db!.get('pendingUploads', id);
    if (upload) {
      upload.status = status;
      if (status === 'failed') {
        upload.retryCount += 1;
      }
      await this.db!.put('pendingUploads', upload);
    }
  }

  async removePendingUpload(id: string) {
    if (!this.db) await this.init();
    await this.db!.delete('pendingUploads', id);
  }

  async storeSyncedProof(proof: ProofRecord, verificationReport?: VerificationReport) {
    if (!this.db) await this.init();
    await this.db!.put('syncedProofs', { ...proof, verificationReport });
  }

  async getSyncedProofs() {
    if (!this.db) await this.init();
    return await this.db!.getAll('syncedProofs');
  }

  async storeVoiceMessage(audioBlob: Blob, threadId: string): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const voiceMessage = {
      id,
      audioBlob,
      threadId,
      timestamp: new Date(),
      status: 'pending' as const,
    };
    
    await this.db!.add('voiceMessages', voiceMessage);
    return id;
  }

  async getVoiceMessages() {
    if (!this.db) await this.init();
    return await this.db!.getAll('voiceMessages');
  }

  async updateVoiceMessage(id: string, updates: Partial<{
    transcription: string;
    aiEnhanced: string;
    status: 'pending' | 'processed' | 'failed';
  }>) {
    if (!this.db) await this.init();
    
    const message = await this.db!.get('voiceMessages', id);
    if (message) {
      Object.assign(message, updates);
      await this.db!.put('voiceMessages', message);
    }
  }

  async clearSyncedData() {
    if (!this.db) await this.init();
    await this.db!.clear('pendingUploads');
    await this.db!.clear('voiceMessages');
  }

  async getStorageStats() {
    if (!this.db) await this.init();
    
    const pending = await this.db!.count('pendingUploads');
    const synced = await this.db!.count('syncedProofs');
    const voices = await this.db!.count('voiceMessages');
    
    return { pending, synced, voices };
  }
}

export const offlineStorage = new OfflineStorageService();