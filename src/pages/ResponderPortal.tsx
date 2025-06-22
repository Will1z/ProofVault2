import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, MessageSquare, Clock, CheckCircle2, AlertTriangle, Phone } from 'lucide-react';
import { useEmergency } from '../contexts/EmergencyContext';
import { useWallet } from '../contexts/WalletContext';
import { ResponderRole } from '../types/emergency';
import EmergencyMap from '../components/EmergencyMap';
import ChatInterface from '../components/ChatInterface';
import toast from 'react-hot-toast';

const ResponderPortal: React.FC = () => {
  const { reports, responders, currentUserRole, registerResponder, setResponderAvailability } = useEmergency();
  const { walletAddress } = useWallet();
  const [isRegistering, setIsRegistering] = useState(!currentUserRole);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    role: 'volunteer' as ResponderRole,
    skills: '',
    verificationCode: '',
    phone: '',
  });

  const currentResponder = responders.find(r => r.id === walletAddress);
  const assignedReports = reports.filter(r => r.responders.includes(walletAddress || ''));
  const nearbyReports = reports.filter(r => r.status === 'active').slice(0, 5);

  const handleRegistration = async () => {
    if (!registrationData.name.trim() || !registrationData.verificationCode.trim()) {
      toast.error('Name and verification code are required');
      return;
    }

    try {
      await registerResponder({
        name: registrationData.name,
        role: registrationData.role,
        skills: registrationData.skills.split(',').map(s => s.trim()).filter(Boolean),
        verificationCode: registrationData.verificationCode,
        isVerified: true, // In production, this would be verified by admin
        isAvailable: true,
        contactInfo: {
          phone: registrationData.phone || undefined,
        },
      });
      setIsRegistering(false);
      toast.success('Responder registration successful!');
    } catch (error) {
      toast.error('Registration failed');
    }
  };

  const handleAvailabilityToggle = () => {
    if (currentResponder) {
      setResponderAvailability(!currentResponder.isAvailable);
      toast.success(`Status updated to ${!currentResponder.isAvailable ? 'Available' : 'Busy'}`);
    }
  };

  const selectedReportData = selectedReport ? reports.find(r => r.id === selectedReport) : null;

  if (isRegistering) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Responder Registration</h1>
          <p className="mt-2 text-gray-600">Join the emergency response network</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={registrationData.name}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={registrationData.role}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, role: e.target.value as ResponderRole }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="volunteer">Volunteer</option>
                <option value="medic">Medical Professional</option>
                <option value="firefighter">Firefighter</option>
                <option value="police">Police Officer</option>
                <option value="search_rescue">Search & Rescue</option>
                <option value="coordinator">Emergency Coordinator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills & Certifications
              </label>
              <input
                type="text"
                value={registrationData.skills}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, skills: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="CPR, First Aid, EMT, etc. (comma separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code *
              </label>
              <input
                type="text"
                value={registrationData.verificationCode}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, verificationCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Official verification code from your organization"
              />
              <p className="text-xs text-gray-500 mt-1">
                Contact your emergency services coordinator for a verification code
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <button
              onClick={handleRegistration}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Register as Responder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Responder Portal
          </h1>
          <p className="mt-2 text-gray-600">Emergency response coordination dashboard</p>
        </div>
        
        {currentResponder && (
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              currentResponder.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                currentResponder.isAvailable ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm font-medium">
                {currentResponder.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
            <button
              onClick={handleAvailabilityToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentResponder.isAvailable
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {currentResponder.isAvailable ? 'Go Busy' : 'Go Available'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Calls</p>
              <p className="text-2xl font-bold text-gray-900">{assignedReports.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nearby Calls</p>
              <p className="text-2xl font-bold text-gray-900">{nearbyReports.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900">3.2m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50">
              <h2 className="text-lg font-semibold text-gray-900">Emergency Locations</h2>
            </div>
            <EmergencyMap
              height="500px"
              onReportSelect={setSelectedReport}
              selectedReport={selectedReport}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Calls */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-gray-900">Your Assigned Calls</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {assignedReports.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active assignments</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {assignedReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report.id);
                        setShowChat(true);
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{report.title}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {report.type.replace('_', ' ')} • {report.location.address || 'Location available'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            report.severity === 'critical' ? 'bg-red-500' :
                            report.severity === 'high' ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`} />
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nearby Emergencies */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-gray-900">Nearby Emergencies</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {nearbyReports.map((report) => (
                <div key={report.id} className="p-3 border-b border-gray-200/50 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{report.title}</p>
                      <p className="text-xs text-gray-500">
                        {report.location.address || `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      report.severity === 'critical' ? 'bg-red-500' :
                      report.severity === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedReportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl h-96">
            <ChatInterface
              threadId={selectedReportData.chatThreadId}
              reportTitle={selectedReportData.title}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponderPortal;