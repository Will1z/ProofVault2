import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Globe, Users, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/emergency"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-1">How we protect and handle your data</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="p-8 space-y-8">
          {/* Introduction */}
          <div className="flex items-start space-x-4">
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Commitment to Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                ProofVault Crisis Response is committed to protecting your privacy and ensuring the security of your personal information. 
                This policy explains how we collect, use, and protect your data when you use our emergency response and evidence verification platform.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Data Collection */}
          <div className="flex items-start space-x-4">
            <Database className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Emergency Reports</h3>
                  <ul className="text-gray-700 text-sm space-y-1 mt-1">
                    <li>• Location data (GPS coordinates) for emergency response</li>
                    <li>• Media files (images, audio, video) you upload</li>
                    <li>• Description and details of emergency situations</li>
                    <li>• Timestamp and metadata of reports</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Account Information</h3>
                  <ul className="text-gray-700 text-sm space-y-1 mt-1">
                    <li>• Wallet address for blockchain verification</li>
                    <li>• Responder credentials and verification codes</li>
                    <li>• Communication preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Technical Data</h3>
                  <ul className="text-gray-700 text-sm space-y-1 mt-1">
                    <li>• Device information and browser type</li>
                    <li>• IP address and general location</li>
                    <li>• Usage analytics and performance data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Usage */}
          <div className="flex items-start space-x-4">
            <Eye className="h-6 w-6 text-purple-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900">Emergency Response</h3>
                  <p className="text-blue-800 text-sm mt-1">
                    Location and emergency data to coordinate response efforts and notify appropriate responders.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900">Evidence Verification</h3>
                  <p className="text-green-800 text-sm mt-1">
                    AI analysis and blockchain recording to verify authenticity and prevent misinformation.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-medium text-purple-900">Platform Improvement</h3>
                  <p className="text-purple-800 text-sm mt-1">
                    Anonymized analytics to improve response times and platform effectiveness.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection */}
          <div className="flex items-start space-x-4">
            <Lock className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Protection & Security</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Encryption</h3>
                  <p className="text-gray-700 text-sm">
                    All data is encrypted in transit and at rest using industry-standard AES-256 encryption.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Blockchain Security</h3>
                  <p className="text-gray-700 text-sm">
                    Evidence hashes are recorded on Algorand blockchain for immutable proof of existence.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Access Controls</h3>
                  <p className="text-gray-700 text-sm">
                    Strict role-based access controls ensure only authorized personnel can view sensitive data.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Data Minimization</h3>
                  <p className="text-gray-700 text-sm">
                    We collect only the minimum data necessary for emergency response and verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="flex items-start space-x-4">
            <Users className="h-6 w-6 text-orange-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Sharing</h2>
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <h3 className="font-medium text-green-900">Emergency Services</h3>
                  <p className="text-green-800 text-sm mt-1">
                    Emergency reports are shared with relevant emergency services and verified responders to coordinate response efforts.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h3 className="font-medium text-blue-900">Verification Partners</h3>
                  <p className="text-blue-800 text-sm mt-1">
                    Media content may be shared with trusted verification organizations for expert analysis and co-signing.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-red-500 bg-red-50">
                  <h3 className="font-medium text-red-900">Legal Requirements</h3>
                  <p className="text-red-800 text-sm mt-1">
                    We may disclose information when required by law or to protect public safety during emergencies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="flex items-start space-x-4">
            <Globe className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-900">Access & Portability</h3>
                  <p className="text-gray-700 mt-1">Request copies of your personal data in a portable format.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Correction</h3>
                  <p className="text-gray-700 mt-1">Update or correct inaccurate personal information.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Deletion</h3>
                  <p className="text-gray-700 mt-1">Request deletion of your data (subject to legal requirements).</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Opt-out</h3>
                  <p className="text-gray-700 mt-1">Withdraw consent for non-essential data processing.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this privacy policy or want to exercise your rights, contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> privacy@proofvault.io<br />
                <strong>Address:</strong> ProofVault Crisis Response, 123 Emergency Lane, Safety City, SC 12345<br />
                <strong>Response Time:</strong> We respond to privacy requests within 30 days.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;