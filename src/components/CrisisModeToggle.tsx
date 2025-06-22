import React from 'react';
import { Shield, ShieldOff, Wifi, WifiOff, Zap } from 'lucide-react';
import { useEmergency } from '../contexts/EmergencyContext';
import { motion } from 'framer-motion';

const CrisisModeToggle: React.FC = () => {
  const { crisisMode, enableCrisisMode, disableCrisisMode, syncOfflineData } = useEmergency();
  const isOnline = navigator.onLine;

  const handleToggle = () => {
    if (crisisMode.isEnabled) {
      disableCrisisMode();
    } else {
      enableCrisisMode();
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            crisisMode.isEnabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {crisisMode.isEnabled ? <Shield className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Crisis Mode</h3>
            <p className="text-sm text-gray-600">
              {crisisMode.isEnabled ? 'Offline-ready emergency mode' : 'Standard mode'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sync Button */}
          {crisisMode.offlineQueue.length > 0 && isOnline && (
            <button
              onClick={syncOfflineData}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Zap className="h-3 w-3" />
              <span>Sync ({crisisMode.offlineQueue.length})</span>
            </button>
          )}

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              crisisMode.isEnabled ? 'bg-red-600' : 'bg-gray-200'
            }`}
          >
            <motion.span
              animate={{ x: crisisMode.isEnabled ? 20 : 2 }}
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform"
            />
          </button>
        </div>
      </div>

      {/* Crisis Mode Info */}
      {crisisMode.isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-gray-200/50"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Offline Queue</span>
              <p className="font-medium text-gray-900">{crisisMode.offlineQueue.length} reports</p>
            </div>
            <div>
              <span className="text-gray-500">Last Sync</span>
              <p className="font-medium text-gray-900">
                {crisisMode.lastSync.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Crisis Mode Active:</strong> Reports are cached locally and will sync when online. 
              Low-data mode enabled to conserve bandwidth.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CrisisModeToggle;