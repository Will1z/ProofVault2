import React from 'react';
import { Brain, Tag, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { AIAnalysis, EventTag } from '../types/verification';
import { motion } from 'framer-motion';

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
  isLoading?: boolean;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900">AI Analysis in Progress</h4>
            <p className="text-sm text-purple-700">Processing content with GPT-4...</p>
          </div>
        </div>
      </div>
    );
  }

  const getEventTagColor = (tag: EventTag) => {
    const colors: Record<EventTag, string> = {
      protest: 'bg-orange-100 text-orange-800',
      explosion: 'bg-red-100 text-red-800',
      medical_emergency: 'bg-red-100 text-red-800',
      displacement: 'bg-blue-100 text-blue-800',
      aid_needed: 'bg-green-100 text-green-800',
      natural_disaster: 'bg-yellow-100 text-yellow-800',
      conflict: 'bg-red-100 text-red-800',
      infrastructure_damage: 'bg-gray-100 text-gray-800',
      humanitarian_crisis: 'bg-purple-100 text-purple-800',
      government_action: 'bg-indigo-100 text-indigo-800',
      civilian_impact: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[tag] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'negative': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUrgencyColor = (level: number) => {
    if (level >= 8) return 'text-red-600 bg-red-100';
    if (level >= 6) return 'text-orange-600 bg-orange-100';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-purple-600" />
        <h4 className="font-medium text-gray-900">AI Content Analysis</h4>
        <div className="flex items-center space-x-2 ml-auto">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(analysis.urgencyLevel)}`}>
            Urgency: {analysis.urgencyLevel}/10
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span>Trust:</span>
            <span className="font-medium">{analysis.credibilityScore}%</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Summary</h5>
        <p className="text-sm text-gray-900 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Key Facts */}
      {analysis.keyFacts.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Key Facts</h5>
          <ul className="space-y-1">
            {analysis.keyFacts.map((fact, index) => (
              <li key={index} className="text-sm text-gray-900 flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Event Tags */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Event Classification</h5>
        <div className="flex flex-wrap gap-2">
          {analysis.eventTags.map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTagColor(tag)}`}
            >
              <Tag className="h-3 w-3 inline mr-1" />
              {tag.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Analysis Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {getSentimentIcon(analysis.sentiment)}
          <div>
            <p className="text-xs text-gray-500">Sentiment</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{analysis.sentiment}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Credibility</p>
            <p className="text-sm font-medium text-gray-900">{analysis.credibilityScore}%</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">Urgency Level</p>
            <p className="text-sm font-medium text-gray-900">{analysis.urgencyLevel}/10</p>
          </div>
        </div>
      </div>

      {/* Contextual Flags */}
      {analysis.contextualFlags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Contextual Flags</h5>
          <div className="flex flex-wrap gap-2">
            {analysis.contextualFlags.map((flag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"
              >
                {flag.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AIAnalysisCard;