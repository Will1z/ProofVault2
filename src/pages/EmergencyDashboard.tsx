import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Map, MessageSquare, Users, Activity, Clock, TrendingUp } from 'lucide-react';
import { useEmergency } from '../contexts/EmergencyContext';
import { useWallet } from '../contexts/WalletContext';
import EmergencyMap from '../components/EmergencyMap';
import EmergencyReportForm from '../components/EmergencyReportForm';
import ChatInterface from '../components/ChatInterface';
import CrisisModeToggle from '../components/CrisisModeToggle';
import QuickActionsPanel from '../components/QuickActionsPanel';
import WeatherWidget from '../components/WeatherWidget';
import { format } from 'date-fns';

const EmergencyDashboard: React.FC = () => {
  const { reports, responders, currentUserRole } = useEmergency();
  const { isConnected } = useWallet();
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showNearbyResponders, setShowNearbyResponders] = useState(false);

  const activeReports = reports.filter(r => r.status === 'active');
  const criticalReports = reports.filter(r => r.severity === 'critical');
  const availableResponders = responders.filter(r => r.isAvailable);

  // Get location for weather (use first active report or default)
  const weatherLocation = activeReports.length > 0 
    ? activeReports[0].location 
    : { lat: 40.7128, lng: -74.0060 }; // NYC default

  const stats = [
    {
      name: 'Active Emergencies',
      value: activeReports.length,
      icon: AlertTriangle,
      color: 'red',
      change: '+2 from last hour',
    },
    {
      name: 'Available Responders',
      value: availableResponders.length,
      icon: Users,
      color: 'green',
      change: '3 nearby',
    },
    {
      name: 'Response Time',
      value: '4.2 min',
      icon: Clock,
      color: 'blue',
      change: '-30s from average',
    },
    {
      name: 'Critical Alerts',
      value: criticalReports.length,
      icon: TrendingUp,
      color: 'orange',
      change: 'Immediate attention',
    },
  ];

  const handleReportSubmit = (reportId: string) => {
    setShowReportForm(false);
    setSelectedReport(reportId);
    setShowChat(true);
  };

  const handleShowNearbyResponders = () => {
    setShowNearbyResponders(!showNearbyResponders);
  };

  const selectedReportData = selectedReport ? reports.find(r => r.id === selectedReport) : null;

  if (showReportForm) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">Emergency Report</h1>
          <p className="mt-2 text-gray-600">Report an emergency situation</p>
        </div>
        <EmergencyReportForm
          onSubmit={handleReportSubmit}
          onCancel={() => setShowReportForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Emergency Command Center
          </h1>
          <p className="mt-2 text-gray-600">Real-time crisis coordination and response</p>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Report Emergency</span>
        </button>
      </div>

      {/* Crisis Mode Toggle */}
      <CrisisModeToggle />

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        onReportEmergency={() => setShowReportForm(true)}
        onShowNearbyResponders={handleShowNearbyResponders}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${
                stat.color === 'red' ? 'bg-red-100 text-red-600' :
                stat.color === 'green' ? 'bg-green-100 text-green-600' :
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Live Emergency Map</h2>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>High</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Responders</span>
                  </div>
                </div>
              </div>
            </div>
            <EmergencyMap
              height="500px"
              onReportSelect={setSelectedReport}
              selectedReport={selectedReport}
              showResponders={showNearbyResponders}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <WeatherWidget 
            location={weatherLocation}
            className="w-full"
          />

          {/* Active Reports */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-gray-900">Active Emergencies</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {activeReports.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active emergencies</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {activeReports.slice(0, 5).map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report.id);
                        setShowChat(true);
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          report.severity === 'critical' ? 'bg-red-500' :
                          report.severity === 'high' ? 'bg-orange-500' :
                          report.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {report.title}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {report.type.replace('_', ' ')} • {format(report.timestamp, 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Responders */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Available Responders</h3>
                {showNearbyResponders && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Showing on Map
                  </span>
                )}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {availableResponders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No responders available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {availableResponders.slice(0, 4).map((responder) => (
                    <div key={responder.id} className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {responder.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {responder.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

export default EmergencyDashboard;