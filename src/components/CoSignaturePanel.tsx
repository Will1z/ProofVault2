import React, { useState } from 'react';
import { Shield, Star, Plus, CheckCircle2, Clock, User } from 'lucide-react';
import { CoSignature, VerificationOrganization } from '../types/verification';
import { useVerification } from '../contexts/VerificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface CoSignaturePanelProps {
  reportId: string;
  coSignatures: CoSignature[];
}

const CoSignaturePanel: React.FC<CoSignaturePanelProps> = ({ reportId, coSignatures }) => {
  const { getVerifiedOrganizations, requestCoSignature } = useVerification();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organizations = getVerifiedOrganizations();

  const handleRequestSignature = async () => {
    if (!selectedOrg) {
      toast.error('Please select an organization');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestCoSignature(reportId, selectedOrg, notes.trim() || undefined);
      setShowRequestForm(false);
      setSelectedOrg('');
      setNotes('');
    } catch (error) {
      toast.error('Failed to request co-signature');
    } finally {
      setIsSubmitting(false);
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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Verification Co-signatures</h4>
          {coSignatures.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {coSignatures.length} verified
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Request Verification</span>
        </button>
      </div>

      {/* Existing Co-signatures */}
      {coSignatures.length > 0 ? (
        <div className="space-y-3 mb-4">
          {coSignatures.map((signature) => (
            <motion.div
              key={signature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-green-900">{signature.organizationName}</h5>
                  <div className="flex items-center space-x-1">
                    {renderStars(signature.credibilityRating)}
                  </div>
                </div>
                <p className="text-sm text-green-700">
                  Verified by {signature.verifierName} ({signature.verifierRole})
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-green-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(signature.verificationDate, 'MMM d, yyyy')}</span>
                  </div>
                  <span className="font-mono">Hash: {signature.verificationHash.substring(0, 12)}...</span>
                </div>
                {signature.notes && (
                  <p className="text-sm text-green-700 mt-2 italic">"{signature.notes}"</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No co-signatures yet</p>
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
            <h5 className="font-medium text-gray-900 mb-3">Request Co-signature</h5>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Organization
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
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context or specific verification requests..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRequestSignature}
                  disabled={!selectedOrg || isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Requesting...' : 'Send Request'}
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
    </div>
  );
};

export default CoSignaturePanel;