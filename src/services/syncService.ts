import { offlineStorage } from './offlineStorage';
import { processFileWithVerification } from './fileProcessor';
import { useApp } from '../contexts/AppContext';
import { useVerification } from '../contexts/VerificationContext';
import toast from 'react-hot-toast';

export interface SyncProgress {
  total: number;
  completed: number;
  current?: string;
  errors: string[];
}

class SyncService {
  private isSyncing = false;
  private syncProgress: SyncProgress = { total: 0, completed: 0, errors: [] };
  private onProgressUpdate?: (progress: SyncProgress) => void;

  async startSync(
    addProof: (proof: any) => void,
    analyzeMedia: (file: File, fileId: string) => Promise<any>,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<void> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    this.onProgressUpdate = onProgress;
    
    try {
      const pendingUploads = await offlineStorage.getPendingUploads();
      const pendingVoices = await offlineStorage.getVoiceMessages();
      
      this.syncProgress = {
        total: pendingUploads.length + pendingVoices.filter(v => v.status === 'pending').length,
        completed: 0,
        errors: [],
      };

      this.updateProgress();

      // Sync pending uploads
      for (const upload of pendingUploads) {
        if (upload.status === 'synced') continue;
        
        try {
          this.syncProgress.current = `Syncing ${upload.metadata.fileName}`;
          this.updateProgress();
          
          await offlineStorage.updateUploadStatus(upload.id, 'syncing');
          
          // Process the file
          const { proofRecord, verificationReport } = await processFileWithVerification(
            upload.file,
            'offline_user', // Mock wallet address for offline uploads
            () => {}, // No progress callback needed here
            analyzeMedia
          );
          
          // Add to app state
          addProof(proofRecord);
          
          // Store in offline cache
          await offlineStorage.storeSyncedProof(proofRecord, verificationReport);
          
          // Mark as synced
          await offlineStorage.updateUploadStatus(upload.id, 'synced');
          
          // Remove from pending
          await offlineStorage.removePendingUpload(upload.id);
          
          this.syncProgress.completed++;
          this.updateProgress();
          
        } catch (error) {
          console.error('Failed to sync upload:', error);
          await offlineStorage.updateUploadStatus(upload.id, 'failed');
          this.syncProgress.errors.push(`Failed to sync ${upload.metadata.fileName}: ${error}`);
        }
      }

      // Sync voice messages (process any pending transcriptions)
      for (const voice of pendingVoices) {
        if (voice.status !== 'pending') continue;
        
        try {
          this.syncProgress.current = `Processing voice message`;
          this.updateProgress();
          
          // In a real implementation, you would process the voice message here
          // For now, we'll just mark it as processed
          await offlineStorage.updateVoiceMessage(voice.id, { status: 'processed' });
          
          this.syncProgress.completed++;
          this.updateProgress();
          
        } catch (error) {
          console.error('Failed to process voice message:', error);
          await offlineStorage.updateVoiceMessage(voice.id, { status: 'failed' });
          this.syncProgress.errors.push(`Failed to process voice message: ${error}`);
        }
      }

      this.syncProgress.current = undefined;
      this.updateProgress();
      
      if (this.syncProgress.errors.length === 0) {
        toast.success(`Successfully synced ${this.syncProgress.completed} items`);
      } else {
        toast.error(`Synced ${this.syncProgress.completed} items with ${this.syncProgress.errors.length} errors`);
      }
      
    } finally {
      this.isSyncing = false;
    }
  }

  private updateProgress(): void {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({ ...this.syncProgress });
    }
  }

  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async getOfflineStats() {
    return await offlineStorage.getStorageStats();
  }
}

export const syncService = new SyncService();