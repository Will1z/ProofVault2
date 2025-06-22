import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MapPin, Paperclip, Phone, Volume2, AudioWaveform as Waveform } from 'lucide-react';
import { useEmergency } from '../contexts/EmergencyContext';
import { ChatMessage } from '../types/emergency';
import { format } from 'date-fns';
import VoiceReplyButton from './VoiceReplyButton';
import { VoiceReply } from '../services/voiceService';

interface ChatInterfaceProps {
  threadId: string;
  reportTitle?: string;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ threadId, reportTitle, onClose }) => {
  const { sendMessage, getThreadMessages, currentUserRole } = useEmergency();
  const [message, setMessage] = useState('');
  const [voiceReplies, setVoiceReplies] = useState<VoiceReply[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = getThreadMessages(threadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceReplies]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessage(threadId, message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceReply = (reply: VoiceReply) => {
    setVoiceReplies(prev => [...prev, reply]);
  };

  const playVoiceMessage = (reply: VoiceReply) => {
    const audio = new Audio(URL.createObjectURL(reply.audioBlob));
    audio.play();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'responder': return 'bg-blue-100 text-blue-800';
      case 'coordinator': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'responder': return '🚑';
      case 'coordinator': return '👨‍💼';
      case 'reporter': return '👤';
      default: return '❓';
    }
  };

  // Combine regular messages and voice replies, sorted by timestamp
  const allMessages = [
    ...messages.map(msg => ({ ...msg, type: 'text' as const })),
    ...voiceReplies.map(reply => ({
      id: reply.id,
      threadId: reply.threadId,
      senderId: reply.senderId,
      senderName: reply.senderName,
      senderRole: 'responder' as const,
      content: reply.aiEnhanced,
      timestamp: reply.timestamp,
      type: 'voice' as const,
      voiceData: reply,
    }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const isResponder = currentUserRole && ['medic', 'firefighter', 'police', 'search_rescue', 'coordinator'].includes(currentUserRole);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900">Emergency Chat</h3>
          {reportTitle && (
            <p className="text-sm text-gray-600 truncate">{reportTitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Start the conversation with responders</p>
            <p className="text-sm mt-1">They'll be notified of your emergency</p>
          </div>
        ) : (
          allMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === 'reporter' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderRole === 'reporter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {msg.senderRole !== 'reporter' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs">{getRoleBadge(msg.senderRole)}</span>
                    <span className="text-xs font-medium">{msg.senderName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(msg.senderRole)}`}>
                      {msg.senderRole}
                    </span>
                  </div>
                )}
                
                {/* Voice Message */}
                {msg.type === 'voice' && 'voiceData' in msg && (
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Waveform className="h-4 w-4" />
                      <span className="text-xs font-medium">Voice Reply</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        [AI-enhanced]
                      </span>
                    </div>
                    <button
                      onClick={() => playVoiceMessage(msg.voiceData)}
                      className="flex items-center space-x-2 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span className="text-xs">Play Audio</span>
                    </button>
                  </div>
                )}
                
                <p className="text-sm">{msg.content}</p>
                
                {/* Voice processing info */}
                {msg.type === 'voice' && 'voiceData' in msg && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-xs opacity-75">
                      Original: "{msg.voiceData.transcription}"
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      Processed in {msg.voiceData.processingTime.toFixed(1)}s
                    </p>
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  msg.senderRole === 'reporter' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {format(msg.timestamp, 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <MapPin className="h-4 w-4" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          
          {/* Voice Reply Button (only for responders) */}
          {isResponder && (
            <VoiceReplyButton
              threadId={threadId}
              onVoiceReply={handleVoiceReply}
            />
          )}
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;