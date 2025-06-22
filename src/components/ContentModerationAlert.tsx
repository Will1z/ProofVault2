import React from 'react';
import { AlertTriangle, Shield, Eye, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  confidence: number;
  action: 'allow' | 'review' | 'block';
  reason?: string;
}

interface ContentModerationAlertProps {
  result: ModerationResult;
  onProceed?: () => void;
  onCancel?: () => void;
  isVisible: boolean;
}

const ContentModerationAlert: React.FC<ContentModerationAlertProps> = ({
  result,
  onProceed,
  onCancel,
  isVisible,
}) => {
  if (!isVisible || !result.flagged) return null;

  const getAlertColor = () => {
    switch (result.action) {
      case 'block': return 'border-red-500 bg-red-50';
      case 'review': return 'border-orange-500 bg-orange-50';
      default: return 'border-yellow-500 bg-yellow-50';
    }
  };

  const getIcon = () => {
    switch (result.action) {
      case 'block': return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'review': return <Flag className="h-6 w-6 text-orange-600" />;
      default: return <Eye className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getTitle = () => {
    switch (result.action) {
      case 'block': return 'Content Blocked';
      case 'review': return 'Content Flagged for Review';
      default: return 'Content Warning';
    }
  };

  const getMessage = () => {
    switch (result.action) {
      case 'block':
        return 'This content has been blocked due to policy violations. It cannot be uploaded to the platform.';
      case 'review':
        return 'This content has been flagged for manual review. It may contain sensitive material that requires verification.';
      default:
        return 'This content may contain sensitive material. Please review before proceeding.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className={`bg-white rounded-xl border-2 ${getAlertColor()} max-w-md w-full p-6`}>
        <div className="flex items-center space-x-3 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-3">{getMessage()}</p>
          
          {result.reason && (
            <div className="p-3 bg-gray-50 rounded-lg mb-3">
              <p className="text-sm text-gray-600">
                <strong>Reason:</strong> {result.reason}
              </p>
            </div>
          )}

          {result.categories.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Flagged Categories:</p>
              <div className="flex flex-wrap gap-2">
                {result.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                  >
                    {category.replace(/[_-]/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
          </div>
        </div>

        <div className="flex space-x-3">
          {result.action !== 'block' && onProceed && (
            <button
              onClick={onProceed}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {result.action === 'review' ? 'Submit for Review' : 'Proceed Anyway'}
            </button>
          )}
          
          <button
            onClick={onCancel}
            className={`${result.action === 'block' ? 'flex-1' : ''} px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors`}
          >
            {result.action === 'block' ? 'Choose Different File' : 'Cancel'}
          </button>
        </div>

        {result.action === 'review' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Review Process</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Content will be reviewed by our moderation team within 24 hours. You'll be notified of the decision.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContentModerationAlert;
export type { ModerationResult };