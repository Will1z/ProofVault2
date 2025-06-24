import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Upload, History, Wallet, LogOut, AlertTriangle, Users, Eye, Wifi, WifiOff, Camera, Zap, Menu, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useEmergency } from '../contexts/EmergencyContext';
import { useVerification } from '../contexts/VerificationContext';
import { openaiService } from '../services/openaiService';
import { pusherService } from '../services/pusherService';
import { cloudinaryService } from '../services/cloudinaryService';
import { elevenlabsService } from '../services/elevenlabsService';
import { translationService } from '../services/translationService';
import { weatherService } from '../services/weatherService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected, walletAddress, connectWallet, disconnectWallet, networkStatus } = useWallet();
  const { crisisMode, reports } = useEmergency();
  const { verificationReports } = useVerification();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const navigation = [
    { name: 'Emergency', href: '/emergency', icon: AlertTriangle, color: 'text-red-600' },
    { name: 'Responder', href: '/responder', icon: Users, color: 'text-blue-600' },
    { name: 'Verification', href: '/verification', icon: Eye, color: 'text-purple-600' },
    { name: 'Evidence', href: '/dashboard', icon: Shield, color: 'text-green-600' },
    { name: 'Upload', href: '/upload', icon: Camera, color: 'text-orange-600' },
    { name: 'History', href: '/history', icon: History, color: 'text-gray-600' },
  ];

  const activeReports = reports.filter(r => r.status === 'active').length;
  const flaggedReports = verificationReports.filter(r => r.verificationStatus === 'flagged').length;

  // Get service status
  const openaiStatus = openaiService.isServiceConfigured();
  const pusherStatus = pusherService.isServiceConfigured();
  const cloudinaryStatus = cloudinaryService.isServiceConfigured();
  const elevenlabsStatus = elevenlabsService.isServiceConfigured();
  const translationStatus = translationService.isServiceConfigured();
  const weatherStatus = weatherService.isServiceConfigured();

  const enhancedFeaturesCount = [
    openaiStatus, cloudinaryStatus, elevenlabsStatus, 
    translationStatus, weatherStatus
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* Crisis Mode Banner */}
      {crisisMode.isEnabled && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium">
          🚨 CRISIS MODE ACTIVE - Offline Ready | {crisisMode.offlineQueue.length} queued reports
        </div>
      )}

      {/* Header */}
      <header className={`bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 ${
        crisisMode.isEnabled ? 'border-t-2 border-t-red-500' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <Link to="/emergency" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div className="hidden sm:block">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ProofVault
                  </span>
                  <div className="text-xs text-gray-500 -mt-1 flex items-center space-x-1">
                    <span className="hidden md:inline">Crisis Response + AI Shield</span>
                    <span className="md:hidden">Crisis Response</span>
                    {enhancedFeaturesCount > 3 && (
                      <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-1 rounded">
                        <Zap className="h-2 w-2" />
                        <span className="text-xs">Enhanced</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Full Button Names */}
            <nav className="hidden lg:flex items-center space-x-2 flex-1 justify-center max-w-4xl mx-4">
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative flex-shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-700' : item.color}`} />
                      <span>{item.name}</span>
                      {item.name === 'Emergency' && activeReports > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {activeReports}
                        </div>
                      )}
                      {item.name === 'Verification' && flaggedReports > 0 && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {flaggedReports}
                        </div>
                      )}
                      {item.name === 'Upload' && enhancedFeaturesCount > 3 && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          <Zap className="h-2 w-2" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Enhanced Service Status Indicators - Hidden on small screens */}
              <div className="hidden xl:flex items-center space-x-1">
                {/* Core Services */}
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  openaiStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${openaiStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span>AI</span>
                </div>

                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  pusherStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${pusherStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span>RT</span>
                </div>

                {/* Enhanced Services */}
                {cloudinaryStatus && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Cloud</span>
                  </div>
                )}

                {elevenlabsStatus && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Voice</span>
                  </div>
                )}

                {translationStatus && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Trans</span>
                  </div>
                )}

                {weatherStatus && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>Weather</span>
                  </div>
                )}
              </div>

              {/* Network Status - Always visible */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                networkStatus.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {networkStatus.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span className="hidden sm:inline">{networkStatus.network}</span>
              </div>

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-mono">
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnectWallet}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Connect Wallet</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-sm"
            >
              <div className="px-4 py-3 space-y-2 max-w-full overflow-hidden">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors relative ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : item.color}`} />
                      <span>{item.name}</span>
                      {item.name === 'Emergency' && activeReports > 0 && (
                        <div className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {activeReports}
                        </div>
                      )}
                      {item.name === 'Verification' && flaggedReports > 0 && (
                        <div className="ml-auto bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {flaggedReports}
                        </div>
                      )}
                      {item.name === 'Upload' && enhancedFeaturesCount > 3 && (
                        <div className="ml-auto bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          <Zap className="h-2 w-2" />
                        </div>
                      )}
                    </Link>
                  );
                })}

                {/* Mobile Service Status */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Service Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                      openaiStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${openaiStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>AI Services</span>
                    </div>
                    <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                      pusherStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${pusherStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>Real-time</span>
                    </div>
                    {cloudinaryStatus && (
                      <div className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Cloud Storage</span>
                      </div>
                    )}
                    {enhancedFeaturesCount > 2 && (
                      <div className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        <Zap className="h-3 w-3" />
                        <span>Enhanced ({enhancedFeaturesCount}/5)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer with Service Info */}
      <footer className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-700">Terms of Service</Link>
            </div>
            <div className="flex items-center space-x-2">
              <span>Enhanced Features:</span>
              <span className="font-medium">{enhancedFeaturesCount}/5 Active</span>
              {enhancedFeaturesCount > 3 && (
                <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded">
                  <Zap className="h-3 w-3" />
                  <span>Full Suite</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;