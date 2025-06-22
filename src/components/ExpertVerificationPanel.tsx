import React, { useState } from 'react';
import { Shield, Star, Send, CheckCircle2, Clock, AlertCircle, User, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerification } from '../contexts/VerificationContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ExpertVerificationPanelProps {
  reportId: string;
  currentStatus: 'pending' | 'verified' | 'disputed' | 'flagged';
  coSignatures: any[];
  onStatusChange?: (newStatus: string) => void;
}

const ExpertVerificationPanel: React.FC<ExpertVerificationPanelProps> = ({
  reportId,
  currentStatus,
  coSignatures,
  onStatusChange,
}) => {
  const { getVerifiedOrganizations, requestCoSignature } = useVerification();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'standard' | 'urgent' | 'critical'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organizations = getVerifiedOrganizations();

  const handleRequestVerification = async () => {
    if (!selectedOrg) {
      toast.error('Please select an organization');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestCoSignature(reportId, selectedOrg, requestNotes.trim() || undefined);
      setShowRequestForm(false);
      setSelectedOrg('');
      setRequestNotes('');
      setUrgencyLevel('standard');
      toast.success('Verification request sent successfully');
      onStatusChange?.('pending');
    } catch (error) {
      toast.error('Failed to send verification request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4" />;
      case 'flagged': return <AlertCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Expert Verification</h4>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)}`}>
              {getStatusIcon(currentStatus)}
              <span className="capitalize">{currentStatus}</span>
            </div>
          </div>
          
          {currentStatus !== 'verified' && (
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Send className="h-3 w-3" />
              <span>Request Verification</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Existing Co-signatures */}
        {coSignatures.length > 0 ? (
          <div className="space-y-3 mb-4">
            <h5 className="text-sm font-medium text-gray-700">Verified By:</h5>
            {coSignatures.map((signature, index) => (
              <motion.div
                key={signature.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h6 className="font-medium text-green-900">{signature.organizationName}</h6>
                    <div className="flex items-center space-x-1">
                      {renderStars(signature.credibilityRating)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-3 w-3 text-green-600" />
                    <span className="text-sm text-green-700">
                      {signature.verifierName} ({signature.verifierRole})
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-green-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(signature.verificationDate, 'MMM d, yyyy HH:mm')}</span>
                    </div>
                    <span className="font-mono">ID: {signature.verificationHash.substring(0, 8)}...</span>
                  </div>
                  {signature.notes && (
                    <div className="mt-2 p-2 bg-white border border-green-200 rounded">
                      <p className="text-sm text-green-700 italic">"{signature.notes}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No expert verifications yet</p>
            <p className="text-xs mt-1">Request verification from trusted organizations</p>
          </div>
        )}

        {/* Request Form */}
        <AnimatePresence>
          {showRequestForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <h5 className="font-medium text-gray-900 mb-4">Request Expert Verification</h5>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Organization *
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type.replace('_', ' ')}) - {org.credibilityRating}/5 ⭐
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="standard">Standard (48-72 hours)</option>
                    <option value="urgent">Urgent (12-24 hours)</option>
                    <option value="critical">Critical (2-6 hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Context
                  </label>
                  <textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Provide context about why expert verification is needed, specific concerns, or areas to focus on..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Urgency Warning */}
                {urgencyLevel === 'critical' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Critical Urgency Selected</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      This will mark the request as critical priority. Use only for time-sensitive situations where immediate verification is essential.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleRequestVerification}
                    disabled={!selectedOrg || isSubmitting}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Sending Request...' : 'Send Verification Request'}
                  </button>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification Benefits */}
        {coSignatures.length === 0 && !showRequestForm && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h6 className="text-sm font-medium text-blue-900 mb-2">Why Request Expert Verification?</h6>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Increases content credibility and trust score</li>
              <li>• Provides professional fact-checking</li>
              <li>• Adds institutional backing to your evidence</li>
              <li>• Helps combat misinformation</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertVerificationPanel;