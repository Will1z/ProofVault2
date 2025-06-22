import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MapPin, 
  Users, 
  AlertTriangle, 
  MessageSquare, 
  Zap,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useEmergency } from '../contexts/EmergencyContext';
import toast from 'react-hot-toast';

interface QuickActionsPanel {
  onReportEmergency: () => void;
  onShowNearbyResponders: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanel> = ({ 
  onReportEmergency, 
  onShowNearbyResponders 
}) => {
  const { reports, responders } = useEmergency();
  const [isExpanded, setIsExpanded] = useState(true);

  const quickActions = [
    {
      id: 'report',
      title: 'Report Emergency',
      description: 'Submit a new emergency report',
      icon: AlertTriangle,
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white',
      action: onReportEmergency,
    },
    {
      id: 'responders',
      title: 'Find Responders',
      description: 'View nearby emergency responders',
      icon: Users,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white',
      action: onShowNearbyResponders,
    },
    {
      id: 'emergency-call',
      title: 'Emergency Call',
      description: 'Direct line to emergency services',
      icon: Phone,
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white',
      action: () => {
        toast.success('Emergency services contacted!');
        // In production, this would initiate an actual emergency call
      },
    },
    {
      id: 'location',
      title: 'Share Location',
      description: 'Broadcast your current location',
      icon: MapPin,
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white',
      action: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              toast.success(`Location shared: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            },
            () => {
              toast.error('Unable to access location');
            }
          );
        } else {
          toast.error('Geolocation not supported');
        }
      },
    },
  ];

  const stats = [
    {
      label: 'Active Reports',
      value: reports.filter(r => r.status === 'active').length,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      label: 'Available Responders',
      value: responders.filter(r => r.isAvailable).length,
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: 'Avg Response Time',
      value: '4.2m',
      icon: Clock,
      color: 'text-blue-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              Live
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-3 bg-gray-50 rounded-lg"
              >
                <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.action}
                className={`${action.color} ${action.textColor} p-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg group`}
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs opacity-90">{action.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-2 pt-2 border-t border-gray-200/50">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">System Online</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-xs text-gray-600">All Services Active</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickActionsPanel;