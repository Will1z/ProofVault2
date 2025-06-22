import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Mic, Image, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useWallet } from '../contexts/WalletContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const History: React.FC = () => {
  const { proofs } = useApp();
  const { isConnected } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'image' | 'document'>('all');

  const filteredProofs = proofs.filter(proof => {
    const matchesSearch = proof.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proof.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proof.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'audio' && proof.fileType.startsWith('audio/')) ||
                       (typeFilter === 'image' && proof.fileType.startsWith('image/')) ||
                       (typeFilter === 'document' && !proof.fileType.startsWith('audio/') && !proof.fileType.startsWith('image/'));
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('audio/')) return <Mic className="h-5 w-5 text-green-600" />;
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Connection Required</h2>
          <p className="text-gray-600">
            Please connect your Algorand wallet to view your proof history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Proof History
        </h1>
        <p className="mt-2 text-gray-600">
          View and manage all your verified evidence records
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search proofs by filename or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="audio">Audio</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredProofs.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {proofs.length === 0 ? 'No proofs yet' : 'No matching proofs'}
            </h3>
            <p className="text-gray-600 mb-4">
              {proofs.length === 0 
                ? 'Upload your first evidence file to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {proofs.length === 0 && (
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Upload Evidence
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProofs.map((proof, index) => (
            <motion.div
              key={proof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(proof.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {proof.fileName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(proof.uploadDate, 'MMM d, yyyy')}</span>
                        </div>
                        <span>•</span>
                        <span className="capitalize">{proof.fileType.split('/')[0]}</span>
                      </div>
                      <p className="mt-3 text-gray-700 line-clamp-2">
                        {proof.summary}
                      </p>
                      {proof.transcript && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 mb-1">TRANSCRIPT</p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {proof.transcript}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      proof.status === 'completed' ? 'bg-green-100 text-green-800' :
                      proof.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {proof.status}
                    </div>
                    <Link
                      to={`/proof/${proof.id}`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">File Hash</span>
                      <p className="font-mono text-xs text-gray-900 truncate" title={proof.fileHash}>
                        {proof.fileHash.slice(0, 16)}...
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">IPFS Hash</span>
                      <p className="font-mono text-xs text-gray-900 truncate" title={proof.ipfsHash}>
                        {proof.ipfsHash.slice(0, 16)}...
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Algorand TX</span>
                      <p className="font-mono text-xs text-gray-900 truncate" title={proof.algorandTxId}>
                        {proof.algorandTxId.slice(0, 16)}...
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Wallet</span>
                      <p className="font-mono text-xs text-gray-900 truncate" title={proof.walletAddress}>
                        {proof.walletAddress.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;