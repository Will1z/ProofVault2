import React, { useState } from 'react';
import { Search, Filter, Shield, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useVerification } from '../contexts/VerificationContext';
import { EventTag } from '../types/verification';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const VerificationDashboard: React.FC = () => {
  const { verificationReports, filterByTags, searchReports } = useVerification();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<EventTag[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'flagged' | 'pending'>('all');

  const eventTags: EventTag[] = [
    'protest', 'explosion', 'medical_emergency', 'displacement', 'aid_needed',
    'natural_disaster', 'conflict', 'infrastructure_damage', 'humanitarian_crisis',
    'government_action', 'civilian_impact', 'other'
  ];

  const filteredReports = verificationReports.filter(report => {
    const matchesSearch = searchQuery === '' || searchReports(searchQuery).includes(report);
    const matchesTags = selectedTags.length === 0 || filterByTags(selectedTags).includes(report);
    const matchesStatus = statusFilter === 'all' || report.verificationStatus === statusFilter;
    
    return matchesSearch && matchesTags && matchesStatus;
  });

  const stats = {
    total: verificationReports.length,
    verified: verificationReports.filter(r => r.verificationStatus === 'verified').length,
    flagged: verificationReports.filter(r => r.verificationStatus === 'flagged').length,
    avgTrustScore: verificationReports.length > 0 
      ? Math.round(verificationReports.reduce((sum, r) => sum + r.overallTrustScore, 0) / verificationReports.length)
      : 0,
  };

  const toggleTag = (tag: EventTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Verification Dashboard</h2>
        <p className="text-gray-600 mt-1">Monitor and analyze media verification reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-gray-900">{stats.flagged}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Trust Score</p>
              <p className={`text-2xl font-bold ${getTrustScoreColor(stats.avgTrustScore)}`}>
                {stats.avgTrustScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports by content, summary, or facts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Event Tags */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Filter by Event Type:</p>
            <div className="flex flex-wrap gap-2">
              {eventTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">Report #{report.id.slice(-8)}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.verificationStatus)}`}>
                      {report.verificationStatus}
                    </span>
                    <div className="flex items-center space-x-1">
                      {report.aiAnalysis.eventTags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-2">{report.aiAnalysis.summary}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Trust Score</span>
                      <p className={`font-medium ${getTrustScoreColor(report.overallTrustScore)}`}>
                        {report.overallTrustScore}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Urgency</span>
                      <p className="font-medium text-gray-900">{report.aiAnalysis.urgencyLevel}/10</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Co-signatures</span>
                      <p className="font-medium text-gray-900">{report.coSignatures.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created</span>
                      <p className="font-medium text-gray-900">
                        {format(report.createdAt, 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  {report.deepfakeAnalysis && (
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      report.deepfakeAnalysis.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      report.deepfakeAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Deepfake: {report.deepfakeAnalysis.riskLevel}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default VerificationDashboard;