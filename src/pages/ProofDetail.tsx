import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Mic, Image, Calendar, Hash, Globe, Blocks as Blockchain, Copy, ExternalLink, Download, Shield } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useVerification } from '../contexts/VerificationContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import BlockchainProofTimeline from '../components/BlockchainProofTimeline';
import DeepfakeDetector from '../components/DeepfakeDetector';
import MediaMetadataCard from '../components/MediaMetadataCard';
import TranscriptionCard from '../components/TranscriptionCard';
import AIAnalysisCard from '../components/AIAnalysisCard';
import CoSignaturePanel from '../components/CoSignaturePanel';

const ProofDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProof } = useApp();
  const { verificationReports } = useVerification();
  
  const proof = id ? getProof(id) : undefined;
  const verificationReport = verificationReports.find(r => r.fileId === id);

  if (!proof) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Proof Not Found</h2>
          <p className="text-gray-600 mb-4">
            The requested proof record could not be found.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('audio/')) return <Mic className="h-6 w-6 text-green-600" />;
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-blue-600" />;
    return <FileText className="h-6 w-6 text-gray-600" />;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const verificationItems = [
    {
      label: 'File Hash (SHA-256)',
      value: proof.fileHash,
      icon: Hash,
      description: 'Cryptographic hash of the original file',
    },
    {
      label: 'IPFS Hash',
      value: proof.ipfsHash,
      icon: Globe,
      description: 'Decentralized storage identifier',
      link: `https://ipfs.io/ipfs/${proof.ipfsHash}`,
    },
    {
      label: 'Algorand Transaction',
      value: proof.algorandTxId,
      icon: Blockchain,
      description: 'Blockchain transaction record',
      link: `https://testnet.algoexplorer.io/tx/${proof.algorandTxId}`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/history"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proof Details</h1>
            <p className="text-gray-600">Verification record for {proof.fileName}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          proof.status === 'completed' ? 'bg-green-100 text-green-800' :
          proof.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {proof.status}
        </div>
      </div>

      {/* File Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0 p-4 bg-gray-50 rounded-xl">
              {getFileIcon(proof.fileType)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{proof.fileName}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">File Type</span>
                  <p className="font-medium text-gray-900 capitalize">
                    {proof.fileType.split('/')[0]}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Upload Date</span>
                  <p className="font-medium text-gray-900">
                    {format(proof.uploadDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Upload Time</span>
                  <p className="font-medium text-gray-900">
                    {format(proof.uploadDate, 'h:mm a')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Wallet</span>
                  <p className="font-mono text-sm text-gray-900 truncate" title={proof.walletAddress}>
                    {proof.walletAddress.slice(0, 8)}...{proof.walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blockchain Proof Timeline */}
      <BlockchainProofTimeline 
        proof={proof}
        verificationReport={verificationReport}
        isExpanded={true}
      />

      {/* Verification Report */}
      {verificationReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Verification Report</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                verificationReport.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                verificationReport.verificationStatus === 'flagged' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {verificationReport.verificationStatus}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Trust Score</span>
                <p className="text-2xl font-bold text-green-600">{verificationReport.overallTrustScore}%</p>
              </div>
              <div>
                <span className="text-gray-500">Co-signatures</span>
                <p className="text-2xl font-bold text-blue-600">{verificationReport.coSignatures.length}</p>
              </div>
              <div>
                <span className="text-gray-500">Event Tags</span>
                <p className="text-2xl font-bold text-purple-600">{verificationReport.aiAnalysis.eventTags.length}</p>
              </div>
              <div>
                <span className="text-gray-500">Urgency Level</span>
                <p className="text-2xl font-bold text-orange-600">{verificationReport.aiAnalysis.urgencyLevel}/10</p>
              </div>
            </div>
          </div>

          {/* Verification Components */}
          <div className="grid gap-6">
            {/* Deepfake Analysis */}
            {verificationReport.deepfakeAnalysis && (
              <DeepfakeDetector analysis={verificationReport.deepfakeAnalysis} />
            )}

            {/* Metadata */}
            <MediaMetadataCard metadata={verificationReport.metadata} />

            {/* Transcription */}
            {verificationReport.transcription && (
              <TranscriptionCard transcription={verificationReport.transcription} />
            )}

            {/* AI Analysis */}
            <AIAnalysisCard analysis={verificationReport.aiAnalysis} />

            {/* Co-signature Panel */}
            <CoSignaturePanel 
              reportId={verificationReport.id}
              coSignatures={verificationReport.coSignatures}
            />
          </div>
        </motion.div>
      )}

      {/* AI Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Summary</h3>
          <div className="max-w-none">
            <p className="text-gray-700 leading-relaxed">{proof.summary}</p>
          </div>
        </div>
      </motion.div>

      {/* Transcript */}
      {proof.transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {proof.transcript}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verification Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Verification Details</h3>
          </div>
          <div className="space-y-6">
            {verificationItems.map((item, index) => (
              <div key={item.label} className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  <item.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(item.value, item.label)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View on blockchain explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="font-mono text-xs text-gray-700 break-all">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center space-x-4"
      >
        <button
          onClick={() => copyToClipboard(JSON.stringify(proof, null, 2), 'Proof data')}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Data</span>
        </button>
      </motion.div>
    </div>
  );
};

export default ProofDetail;