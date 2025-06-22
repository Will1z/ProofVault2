import React, { useState } from 'react';
import { Shield, Upload, Search, TrendingUp } from 'lucide-react';
import { useVerification } from '../contexts/VerificationContext';
import VerificationDashboard from '../components/VerificationDashboard';
import { motion } from 'framer-motion';

const VerificationCenter: React.FC = () => {
  const { verificationReports } = useVerification();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'search'>('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'upload', name: 'Verify Media', icon: Upload },
    { id: 'search', name: 'Search Reports', icon: Search },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-3 mb-4"
        >
          <Shield className="h-12 w-12 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Fake News Shield
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 text-lg max-w-2xl mx-auto"
        >
          Advanced media verification with AI-powered deepfake detection, content analysis, and expert co-signatures
        </motion.p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-2">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'dashboard' && <VerificationDashboard />}
        
        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Media Verification Upload</h3>
            <p className="text-gray-600 mb-6">
              Upload media files to the main Upload page for comprehensive verification analysis
            </p>
            <a
              href="/upload"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Go to Upload Page
            </a>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Verification Reports</h3>
              <p className="text-gray-600">
                Search through {verificationReports.length} verification reports by content, tags, or metadata
              </p>
            </div>
            
            {/* This would contain the search interface - for now showing the dashboard */}
            <VerificationDashboard />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerificationCenter;