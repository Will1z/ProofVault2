import React from 'react';
import { MapPin, Camera, Clock, Smartphone, Globe, Info } from 'lucide-react';
import { MediaMetadata } from '../types/verification';
import { format } from 'date-fns';

interface MediaMetadataCardProps {
  metadata: MediaMetadata;
}

const MediaMetadataCard: React.FC<MediaMetadataCardProps> = ({ metadata }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Info className="h-4 w-4 text-gray-600" />
        <h4 className="font-medium text-gray-900">Media Metadata</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Information */}
        {metadata.device && (
          <div className="flex items-center space-x-3">
            <Smartphone className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Device</p>
              <p className="text-sm font-medium text-gray-900">{metadata.device}</p>
            </div>
          </div>
        )}

        {/* Resolution */}
        {metadata.resolution && (
          <div className="flex items-center space-x-3">
            <Camera className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Resolution</p>
              <p className="text-sm font-medium text-gray-900">{metadata.resolution}</p>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {metadata.timestamp && (
          <div className="flex items-center space-x-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Captured</p>
              <p className="text-sm font-medium text-gray-900">
                {format(metadata.timestamp, 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          </div>
        )}

        {/* Location */}
        {metadata.location && (
          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Location ({metadata.location.source})</p>
              <p className="text-sm font-medium text-gray-900">
                {metadata.location.lat.toFixed(6)}, {metadata.location.lng.toFixed(6)}
              </p>
              {metadata.location.accuracy && (
                <p className="text-xs text-gray-500">±{metadata.location.accuracy}m accuracy</p>
              )}
            </div>
          </div>
        )}

        {/* File Size */}
        <div className="flex items-center space-x-3">
          <Globe className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">File Size</p>
            <p className="text-sm font-medium text-gray-900">{formatFileSize(metadata.fileSize)}</p>
          </div>
        </div>

        {/* Duration (for video/audio) */}
        {metadata.duration && (
          <div className="flex items-center space-x-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-medium text-gray-900">{formatDuration(metadata.duration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* EXIF Data Preview */}
      {metadata.exifData && Object.keys(metadata.exifData).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Technical Details</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(metadata.exifData)
              .filter(([key]) => !['gpsLatitude', 'gpsLongitude'].includes(key))
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">
                    {String(value).substring(0, 20)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaMetadataCard;