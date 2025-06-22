import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Eye, Clock } from 'lucide-react';
import { DeepfakeAnalysis } from '../types/verification';
import { motion } from 'framer-motion';

interface DeepfakeDetectorProps {
  analysis: DeepfakeAnalysis;
  isLoading?: boolean;
}

const DeepfakeDetector: React.FC<DeepfakeDetectorProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Analyzing for Deepfakes</h4>
            <p className="text-sm text-blue-700">Running advanced detection algorithms...</p>
          </div>
        </div>
      </div>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <Shield className="h-5 w-5" />;
      case 'low':
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const color = getRiskColor(analysis.riskLevel);
  const bgColor = `bg-${color}-50`;
  const borderColor = `border-${color}-200`;
  const textColor = `text-${color}-900`;
  const iconColor = `text-${color}-600`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${bgColor} ${borderColor} border rounded-lg p-4`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={iconColor}>
            {getRiskIcon(analysis.riskLevel)}
          </div>
          <div>
            <h4 className={`font-medium ${textColor}`}>
              Deepfake Analysis: {analysis.riskLevel.toUpperCase()} Risk
            </h4>
            <p className={`text-sm ${textColor.replace('900', '700')}`}>
              {analysis.confidence.toFixed(1)}% manipulation probability
            </p>
          </div>
        </div>
        
        {analysis.flaggedForReview && (
          <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
            Flagged for Review
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={textColor.replace('900', '700')}>Detection Method:</span>
          <span className={`font-medium ${textColor}`}>{analysis.detectionMethod}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={textColor.replace('900', '700')}>Analysis Time:</span>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className={`font-medium ${textColor}`}>
              {analysis.analysisTimestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={textColor.replace('900', '600')}>Manipulation Confidence</span>
            <span className={`font-medium ${textColor}`}>{analysis.confidence.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-${color}-500`}
              style={{ width: `${analysis.confidence}%` }}
            />
          </div>
        </div>

        {analysis.reviewNotes && (
          <div className="mt-3 p-2 bg-white/50 rounded border">
            <p className={`text-xs ${textColor.replace('900', '700')}`}>
              <strong>Review Notes:</strong> {analysis.reviewNotes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DeepfakeDetector;