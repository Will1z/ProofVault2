import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext';
import { AppProvider } from './contexts/AppContext';
import { EmergencyProvider } from './contexts/EmergencyContext';
import { VerificationProvider } from './contexts/VerificationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import History from './pages/History';
import ProofDetail from './pages/ProofDetail';
import EmergencyDashboard from './pages/EmergencyDashboard';
import ResponderPortal from './pages/ResponderPortal';
import VerificationCenter from './pages/VerificationCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProofBotWidget from './components/ProofBotWidget';

function App() {
  return (
    <WalletProvider>
      <AppProvider>
        <EmergencyProvider>
          <VerificationProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/emergency" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/proof/:id" element={<ProofDetail />} />
                    <Route path="/emergency" element={<EmergencyDashboard />} />
                    <Route path="/responder" element={<ResponderPortal />} />
                    <Route path="/verification" element={<VerificationCenter />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                  </Routes>
                </Layout>
                
                {/* ProofBot AI Assistant Widget */}
                <ProofBotWidget />
                
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1F2937',
                      color: '#F9FAFB',
                      borderRadius: '12px',
                      padding: '16px',
                    },
                  }}
                />
              </div>
            </Router>
          </VerificationProvider>
        </EmergencyProvider>
      </AppProvider>
    </WalletProvider>
  );
}

export default App;