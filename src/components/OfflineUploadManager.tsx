import React, { useState, useEffect } from 'react';
import { Upload, Wifi, WifiOff, FolderSync as Sync, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineStorage } from '../services/offlineStorage';
import { syncService, SyncProgress } from '../services/syncService';
import { useApp } from '../contexts/AppContext';
import { useVerification } from '../contexts/VerificationContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface OfflineUploadManagerProps {
  onUploadOffline?: (file: File, metadata: any) => void;
}

const OfflineUploadManager: React.FC<OfflineUploadManagerProps> = ({ onUploadOffline }) => {
  const { addProof } = useApp();
  const { analyzeMedia } = useVerification();
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({ pending: 0, synced: 0, voices: 0 });

  useEffect(() => {
    loadPendingUploads();
    loadStats();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingUploads = async () => {
    try {
      const uploads = await offlineStorage.getPendingUploads();
      setPendingUploads(uploads);
    } catch (error) {
      console.error('Failed to load pending uploads:', error);
    }
  };

  const loadStats = async () => {
    try {
      const newStats = await syncService.getOfflineStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleOfflineUpload = async (file: File) => {
    try {
      // Get current location if available
      let location: { lat: number; lng: number } | undefined;
      
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000,
            });
          });
          
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        }
      } catch (error) {
        console.log('Geolocation not available');
      }

      const metadata = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        timestamp: new Date(),
        location,
        description: `Offline upload: ${file.name}`,
      };

      const uploadId = await offlineStorage.storePendingUpload(file, metadata);
      
      toast.success('File queued for upload when online');
      onUploadOffline?.(file, metadata);
      
      await loadPendingUploads();
      await loadStats();
      
    } catch (error) {
      toast.error('Failed to queue file for upload');
      console.error('Offline upload error:', error);
    }
  };

  const startSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      await syncService.startSync(
        addProof,
        analyzeMedia,
        (progress) => setSyncProgress(progress)
      );
      
      await loadPendingUploads();
      await loadStats();
      setSyncProgress(null);
      
    } catch (error) {
      toast.error('Sync failed');
      console.error('Sync error:', error);
      setSyncProgress(null);
    }
  };

  const removePendingUpload = async (id: string) => {
    try {
      await offlineStorage.removePendingUpload(id);
      await loadPendingUploads();
      await loadStats();
      toast.success('Upload removed from queue');
    } catch (error) {
      toast.error('Failed to remove upload');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'syncing': return <Sync className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'synced': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'synced': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Upload className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Offline Upload Manager</h3>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        
        {isOnline && stats.pending > 0 && (
          <button
            onClick={startSync}
            disabled={syncService.isSyncInProgress()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sync className={`h-4 w-4 ${syncService.isSyncInProgress() ? 'animate-spin' : ''}`} />
            <span>Sync All ({stats.pending})</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-yellow-700">Pending</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{stats.synced}</p>
          <p className="text-sm text-green-700">Synced</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{stats.voices}</p>
          <p className="text-sm text-blue-700">Voice Messages</p>
        </div>
      </div>

      {/* Sync Progress */}
      <AnimatePresence>
        {syncProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Syncing...</span>
              <span className="text-sm text-blue-700">
                {syncProgress.completed}/{syncProgress.total}
              </span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
              />
            </div>
            
            {syncProgress.current && (
              <p className="text-sm text-blue-700">{syncProgress.current}</p>
            )}
            
            {syncProgress.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {syncProgress.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Uploads List */}
      <div className="space-y-3">
        {pendingUploads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pending uploads</p>
            <p className="text-xs mt-1">Files uploaded while offline will appear here</p>
          </div>
        ) : (
          pendingUploads.map((upload) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(upload.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {upload.metadata.fileName}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatFileSize(upload.metadata.fileSize)}</span>
                    <span>{format(upload.createdAt, 'MMM d, HH:mm')}</span>
                    {upload.retryCount > 0 && (
                      <span className="text-orange-600">
                        Retries: {upload.retryCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                  {upload.status}
                </span>
                
                {upload.status === 'pending' && (
                  <button
                    onClick={() => removePendingUpload(upload.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Offline Upload Instructions */}
      {!isOnline && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2 text-amber-800">
            <WifiOff className="h-4 w-4" />
            <span className="font-medium">Offline Mode Active</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            Files uploaded while offline will be queued and automatically synced when you reconnect to the internet.
          </p>
        </div>
      )}
    </div>
  );
};

export default OfflineUploadManager;