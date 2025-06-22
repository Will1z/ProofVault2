import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsentCheckboxProps {
  onConsentChange: (consented: boolean) => void;
  required?: boolean;
  className?: string;
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ 
  onConsentChange, 
  required = true,
  className = '' 
}) => {
  const [consented, setConsented] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleConsentChange = (checked: boolean) => {
    setConsented(checked);
    onConsentChange(checked);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Consent Checkbox */}
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="consent-checkbox"
          checked={consented}
          onChange={(e) => handleConsentChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          required={required}
        />
        <label htmlFor="consent-checkbox" className="text-sm text-gray-700 leading-relaxed">
          I consent to the collection and processing of my data for emergency response purposes, 
          and I agree to the{' '}
          <Link 
            to="/terms" 
            target="_blank"
            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center"
          >
            Terms of Service
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
          {' '}and{' '}
          <Link 
            to="/privacy" 
            target="_blank"
            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center"
          >
            Privacy Policy
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Show Details Toggle */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        {showDetails ? 'Hide details' : 'What data is collected?'}
      </button>

      {/* Detailed Information */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800 space-y-2">
                <h4 className="font-medium">Data Collection for Emergency Response:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Location:</strong> GPS coordinates to dispatch responders</li>
                  <li>• <strong>Emergency Details:</strong> Description, severity, and type</li>
                  <li>• <strong>Media Files:</strong> Photos, audio, or video evidence</li>
                  <li>• <strong>Contact Info:</strong> For coordination and updates</li>
                  <li>• <strong>Verification Data:</strong> AI analysis and blockchain records</li>
                </ul>
                <div className="pt-2 border-t border-blue-200">
                  <p className="font-medium">Your Rights:</p>
                  <p>You can withdraw consent at any time, though this may limit our ability to provide emergency assistance. Data is shared only with verified emergency responders and relevant authorities.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Notice */}
      {required && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium">Emergency Data Sharing Notice:</p>
              <p>
                During active emergencies, your information may be shared immediately with emergency services 
                and verified responders to ensure rapid response and coordination.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentCheckbox;