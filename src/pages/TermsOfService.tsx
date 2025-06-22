import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Shield, Users, Gavel, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TermsOfService: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-1">Legal terms and conditions for using ProofVault</p>
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
            <FileText className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using ProofVault Crisis Response ("the Service"), you agree to be bound by these Terms of Service. 
                This platform is designed for emergency response coordination and evidence verification. Use of this service during 
                actual emergencies should complement, not replace, official emergency services.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Emergency Use */}
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Emergency Use Guidelines</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">IMPORTANT: Life-Threatening Emergencies</span>
                </div>
                <p className="text-red-700 text-sm">
                  For immediate life-threatening emergencies, always call your local emergency number (911, 112, etc.) FIRST. 
                  ProofVault is a supplementary tool for coordination and evidence management.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900">Appropriate Use</h3>
                  <ul className="text-gray-700 text-sm space-y-1 mt-1">
                    <li>• Coordinating emergency response efforts</li>
                    <li>• Documenting and verifying evidence</li>
                    <li>• Communicating with verified responders</li>
                    <li>• Sharing situational awareness information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Prohibited Use</h3>
                  <ul className="text-gray-700 text-sm space-y-1 mt-1">
                    <li>• False emergency reports or hoax calls</li>
                    <li>• Uploading inappropriate or harmful content</li>
                    <li>• Impersonating emergency personnel</li>
                    <li>• Using the service for non-emergency purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="flex items-start space-x-4">
            <Users className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">User Responsibilities</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Accurate Information</h3>
                  <p className="text-green-800 text-sm">
                    Provide truthful, accurate information in emergency reports. False reports can endanger lives and waste resources.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Content Verification</h3>
                  <p className="text-blue-800 text-sm">
                    Only upload authentic media. Manipulated or fake content undermines the platform's integrity.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Responder Verification</h3>
                  <p className="text-purple-800 text-sm">
                    Emergency responders must provide valid credentials and maintain professional conduct.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">Privacy Respect</h3>
                  <p className="text-orange-800 text-sm">
                    Respect privacy of individuals in emergency situations. Avoid sharing personal information unnecessarily.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Features */}
          <div className="flex items-start space-x-4">
            <Shield className="h-6 w-6 text-purple-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Platform Features & Limitations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">AI-Powered Verification</h3>
                  <p className="text-gray-700 text-sm mt-1">
                    Our AI systems analyze content for authenticity and provide risk assessments. While highly accurate, 
                    these systems are not infallible and should be used alongside human judgment.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Blockchain Recording</h3>
                  <p className="text-gray-700 text-sm mt-1">
                    Evidence hashes are recorded on the Algorand blockchain for immutable proof of existence. 
                    This creates a permanent record that cannot be altered or deleted.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Real-time Communication</h3>
                  <p className="text-gray-700 text-sm mt-1">
                    Chat and coordination features depend on internet connectivity. In areas with poor connectivity, 
                    use alternative communication methods.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Liability */}
          <div className="flex items-start space-x-4">
            <Gavel className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Liability & Disclaimers</h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-red-500 bg-red-50">
                  <h3 className="font-medium text-red-900">Service Availability</h3>
                  <p className="text-red-800 text-sm mt-1">
                    We strive for 99.9% uptime but cannot guarantee uninterrupted service. Technical issues, 
                    maintenance, or external factors may affect availability.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                  <h3 className="font-medium text-orange-900">User-Generated Content</h3>
                  <p className="text-orange-800 text-sm mt-1">
                    Users are responsible for content they upload. We moderate content but cannot guarantee 
                    the accuracy or appropriateness of all user submissions.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h3 className="font-medium text-blue-900">Third-Party Services</h3>
                  <p className="text-blue-800 text-sm mt-1">
                    We integrate with third-party services (AI providers, blockchain networks, etc.). 
                    We are not responsible for their availability or performance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="flex items-start space-x-4">
            <Shield className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Handling & Privacy</h2>
              <p className="text-gray-700 mb-3">
                Your privacy is important to us. Please review our{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Privacy Policy
                </Link>{' '}
                for detailed information about how we collect, use, and protect your data.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">Emergency Data Sharing</h3>
                <p className="text-indigo-800 text-sm">
                  During emergencies, your location and report data may be shared with emergency services, 
                  verified responders, and relevant authorities to coordinate response efforts.
                </p>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div className="flex items-start space-x-4">
            <Clock className="h-6 w-6 text-gray-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Updates to Terms</h2>
              <p className="text-gray-700 mb-3">
                We may update these terms periodically to reflect changes in our service or legal requirements. 
                Significant changes will be communicated through the platform or via email.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Continued Use:</strong> By continuing to use the service after changes are posted, 
                  you agree to the updated terms.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              Questions about these terms? Need to report a violation? Contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Legal Team:</strong> legal@proofvault.io<br />
                <strong>Emergency Support:</strong> support@proofvault.io<br />
                <strong>Address:</strong> ProofVault Crisis Response, 123 Emergency Lane, Safety City, SC 12345<br />
                <strong>Phone:</strong> +1 (555) 123-HELP
              </p>
            </div>
          </div>

          {/* Acceptance */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Acknowledgment</h3>
              <p className="text-blue-800 text-sm">
                By using ProofVault Crisis Response, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;