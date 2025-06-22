import React, { useState } from 'react';
import { CheckCircle2, Clock, Hash, Globe, Blocks, Shield, ExternalLink, Copy, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProofRecord } from '../contexts/AppContext';
import { VerificationReport } from '../types/verification';
import { format } from 'date-fns';
import { getIPFSUrl } from '../services/fileProcessor';
import { algorandService } from '../services/algorandService';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface BlockchainProofTimelineProps {
  proof: ProofRecord;
  verificationReport?: VerificationReport;
  isExpanded?: boolean;
}

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp?: Date;
  icon: React.ComponentType<{ className?: string }>;
  details?: {
    hash?: string;
    link?: string;
    metadata?: Record<string, any>;
  };
}

const BlockchainProofTimeline: React.FC<BlockchainProofTimelineProps> = ({ 
  proof, 
  verificationReport,
  isExpanded = false 
}) => {
  const { networkStatus } = useWallet();
  const [expanded, setExpanded] = useState(isExpanded);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const steps: TimelineStep[] = [
    {
      id: 'upload',
      title: 'Upload Received',
      description: 'File uploaded and initial processing started',
      status: 'completed',
      timestamp: proof.uploadDate,
      icon: CheckCircle2,
      details: {
        metadata: {
          fileName: proof.fileName,
          fileType: proof.fileType,
          fileSize: `${(proof.fileType.length / 1024).toFixed(2)} KB`,
        }
      }
    },
    {
      id: 'ai_summary',
      title: 'AI Summary Generated',
      description: 'Content analyzed and summarized using GPT-4',
      status: proof.summary ? 'completed' : 'pending',
      timestamp: proof.uploadDate,
      icon: CheckCircle2,
      details: {
        metadata: {
          summary: proof.summary,
          transcript: proof.transcript,
        }
      }
    },
    {
      id: 'hash',
      title: 'File Hashed (SHA256)',
      description: 'Cryptographic hash generated for integrity verification',
      status: proof.fileHash ? 'completed' : 'pending',
      timestamp: proof.uploadDate,
      icon: Hash,
      details: {
        hash: proof.fileHash,
        metadata: {
          algorithm: 'SHA-256',
          hashLength: '64 characters',
        }
      }
    },
    {
      id: 'ipfs',
      title: 'IPFS Upload via Stracha',
      description: 'File stored on decentralized IPFS network using Stracha',
      status: proof.ipfsHash ? 'completed' : 'pending',
      timestamp: proof.uploadDate,
      icon: Globe,
      details: {
        hash: proof.ipfsHash,
        link: getIPFSUrl(proof.ipfsHash),
        metadata: {
          network: 'IPFS',
          provider: 'Stracha',
          gateway: 'ipfs.io',
          pinned: 'Yes',
        }
      }
    },
    {
      id: 'blockchain',
      title: 'Hash Logged on Algorand',
      description: `Proof-of-existence recorded on ${networkStatus.network} blockchain`,
      status: proof.algorandTxId ? 'completed' : 'pending',
      timestamp: proof.uploadDate,
      icon: Blocks,
      details: {
        hash: proof.algorandTxId,
        link: algorandService.getExplorerUrl(proof.algorandTxId),
        metadata: {
          network: `Algorand ${networkStatus.network}`,
          blockTime: '~4.5 seconds',
          lastRound: networkStatus.lastRound,
          nodeStatus: networkStatus.online ? 'Online' : 'Offline',
        }
      }
    },
  ];

  // Add verification step if available
  if (verificationReport) {
    steps.push({
      id: 'verification',
      title: 'Verification Analysis Complete',
      description: 'Deepfake detection and content verification finished',
      status: verificationReport.verificationStatus === 'verified' ? 'completed' : 
              verificationReport.verificationStatus === 'flagged' ? 'failed' : 'pending',
      timestamp: verificationReport.createdAt,
      icon: Shield,
      details: {
        metadata: {
          trustScore: `${verificationReport.overallTrustScore}%`,
          status: verificationReport.verificationStatus,
          coSignatures: verificationReport.coSignatures.length,
        }
      }
    });
  }

  // Add co-signature step if available
  if (verificationReport?.coSignatures.length > 0) {
    steps.push({
      id: 'cosigned',
      title: `Co-signed by ${verificationReport.coSignatures[0].organizationName}`,
      description: 'Expert verification and co-signature added',
      status: 'completed',
      timestamp: verificationReport.coSignatures[0].verificationDate,
      icon: Shield,
      details: {
        hash: verificationReport.coSignatures[0].verificationHash,
        metadata: {
          organization: verificationReport.coSignatures[0].organizationName,
          verifier: verificationReport.coSignatures[0].verifierName,
          rating: `${verificationReport.coSignatures[0].credibilityRating}/5 stars`,
        }
      }
    });
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectorColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Blocks className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Blockchain Proof Timeline</h3>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {steps.filter(s => s.status === 'completed').length}/{steps.length} Complete
          </span>
          {/* Network Status Indicator */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            networkStatus.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {networkStatus.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{networkStatus.network} {networkStatus.online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>{expanded ? 'Collapse' : 'Expand'}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-6 top-12 w-0.5 h-16 ${getConnectorColor(step.status)}`} />
                )}
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 pb-8"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                      {step.timestamp && (
                        <span className="text-sm text-gray-500">
                          {format(step.timestamp, 'MMM d, HH:mm')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    
                    {/* Hash/Link Display */}
                    {step.details?.hash && (
                      <div className="mt-2 flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {step.details.hash.substring(0, 16)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(step.details.hash!, step.title)}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {step.details.link && (
                          <a
                            href={step.details.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Details Toggle */}
                    {step.details?.metadata && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowDetails(showDetails === step.id ? null : step.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {showDetails === step.id ? 'Hide details' : 'Show details'}
                        </button>
                        
                        <AnimatePresence>
                          {showDetails === step.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(step.details.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-500 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1')}:
                                    </span>
                                    <span className="text-gray-900 font-medium truncate ml-2">
                                      {typeof value === 'string' && value.length > 30 
                                        ? `${value.substring(0, 30)}...` 
                                        : String(value)
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact View */}
      {!expanded && (
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                <step.icon className="h-4 w-4" />
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${getConnectorColor(step.status)}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Proof ID</span>
            <p className="font-mono text-xs text-gray-900 truncate">
              {proof.id}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p className={`font-medium ${
              proof.status === 'completed' ? 'text-green-600' :
              proof.status === 'processing' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {proof.status}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Network</span>
            <p className="font-medium text-gray-900 capitalize">
              {networkStatus.network} ({networkStatus.online ? 'Online' : 'Offline'})
            </p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium text-gray-900">
              {format(proof.uploadDate, 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainProofTimeline;