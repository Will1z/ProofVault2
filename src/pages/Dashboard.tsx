import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, History, Shield, FileText, Mic, Image, Clock, CheckCircle2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useApp } from '../contexts/AppContext';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { isConnected } = useWallet();
  const { proofs } = useApp();

  const recentProofs = proofs.slice(0, 3);
  const completedProofs = proofs.filter(p => p.status === 'completed').length;
  const processingProofs = proofs.filter(p => p.status === 'processing').length;

  const stats = [
    {
      name: 'Total Proofs',
      value: proofs.length,
      icon: Shield,
      color: 'blue',
    },
    {
      name: 'Completed',
      value: completedProofs,
      icon: CheckCircle2,
      color: 'green',
    },
    {
      name: 'Processing',
      value: processingProofs,
      icon: Clock,
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
        >
          ProofVault Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-gray-600 text-lg"
        >
          Secure, AI-powered evidence management on the blockchain
        </motion.p>
      </div>

      {!isConnected && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mx-auto mb-4">
            <Shield className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Connect Your Wallet</h3>
          <p className="text-amber-700 mb-4">
            Connect your Algorand wallet to start securing your evidence on the blockchain.
          </p>
        </motion.div>
      )}

      {/* Stats */}
      {isConnected && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.name}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'green' ? 'bg-green-100 text-green-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Link
          to="/upload"
          className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-8 transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Upload Evidence</h3>
              <p className="text-blue-100 mt-1">
                Secure your files with AI analysis and blockchain verification
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-4 text-blue-100">
            <FileText className="h-5 w-5" />
            <Mic className="h-5 w-5" />
            <Image className="h-5 w-5" />
            <span className="text-sm">Supports documents, audio, and images</span>
          </div>
        </Link>

        <Link
          to="/history"
          className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-8 transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <History className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Proof History</h3>
              <p className="text-purple-100 mt-1">
                View and manage all your verified evidence records
              </p>
            </div>
          </div>
          <div className="mt-6 text-purple-100">
            <span className="text-sm">
              {proofs.length} proof{proofs.length !== 1 ? 's' : ''} stored securely
            </span>
          </div>
        </Link>
      </motion.div>

      {/* Recent Activity */}
      {isConnected && recentProofs.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200/50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200/50">
            {recentProofs.map((proof) => (
              <Link
                key={proof.id}
                to={`/proof/${proof.id}`}
                className="block p-6 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      proof.fileType.startsWith('audio') ? 'bg-green-100 text-green-600' :
                      proof.fileType.startsWith('image') ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {proof.fileType.startsWith('audio') ? (
                        <Mic className="h-4 w-4" />
                      ) : proof.fileType.startsWith('image') ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{proof.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {proof.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    proof.status === 'completed' ? 'bg-green-100 text-green-800' :
                    proof.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {proof.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;