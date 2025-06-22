import React, { useState } from 'react';
import { Mic, Volume2, Clock, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { TranscriptionData } from '../types/verification';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionCardProps {
  transcription: TranscriptionData;
  isLoading?: boolean;
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({ transcription, isLoading }) => {
  const [showSegments, setShowSegments] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse">
            <Mic className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-900">Transcribing Audio</h4>
            <p className="text-sm text-green-700">Processing with Whisper AI...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-gray-900">Audio Transcription</h4>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Languages className="h-4 w-4" />
            <span>{transcription.language.toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Volume2 className="h-4 w-4" />
            <span>{(transcription.confidence * 100).toFixed(1)}% confidence</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{transcription.processingTime}s</span>
          </div>
        </div>
      </div>

      {/* Main Transcription */}
      <div className="mb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-900 leading-relaxed">{transcription.text}</p>
        </div>
      </div>

      {/* Segments Toggle */}
      {transcription.segments && transcription.segments.length > 0 && (
        <div>
          <button
            onClick={() => setShowSegments(!showSegments)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showSegments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{showSegments ? 'Hide' : 'Show'} Timestamped Segments</span>
          </button>

          <AnimatePresence>
            {showSegments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {transcription.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </div>
                    <p className="text-sm text-gray-900 flex-1">{segment.text}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TranscriptionCard;