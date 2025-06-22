import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Send, X, Volume2, Globe, Zap, AlertTriangle, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { proofBotService, ProofBotMessage, ProofBotResponse } from '../services/proofBotService';
import { useEmergency } from '../contexts/EmergencyContext';
import { useWallet } from '../contexts/WalletContext';
import { voiceService } from '../services/voiceService';
import toast from 'react-hot-toast';

interface ProofBotWidgetProps {
  className?: string;
}

const ProofBotWidget: React.FC<ProofBotWidgetProps> = ({ className = '' }) => {
  const { crisisMode } = useEmergency();
  const { walletAddress } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ProofBotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [voiceMode, setVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    try {
      // Get user location if available
      let location: { lat: number; lng: number } | undefined;
      
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 300000,
            });
          });
          
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        }
      } catch (error) {
        console.log('Location not available for ProofBot');
      }

      const newSessionId = await proofBotService.initializeSession(
        walletAddress || 'anonymous',
        {
          language: currentLanguage,
          crisisMode: crisisMode.isEnabled,
          location,
        }
      );

      setSessionId(newSessionId);

      // Send welcome message
      const welcomeResponse = await proofBotService.sendMessage(
        newSessionId,
        crisisMode.isEnabled 
          ? "Emergency assistance needed"
          : "Hello, I need help with ProofVault",
        'text'
      );

      const welcomeMessage: ProofBotMessage = {
        id: `welcome_${Date.now()}`,
        type: 'bot',
        content: welcomeResponse.text,
        timestamp: new Date(),
        mode: 'text',
        audioUrl: welcomeResponse.audioUrl,
        urgent: welcomeResponse.urgent,
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize ProofBot session:', error);
      toast.error('Failed to start ProofBot session');
    }
  };

  const sendMessage = async (message: string, mode: 'text' | 'voice' = 'text', audioBlob?: Blob) => {
    if (!sessionId || !message.trim()) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: ProofBotMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
      mode,
      language: currentLanguage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await proofBotService.sendMessage(sessionId, message, mode, audioBlob);
      
      // Add bot response
      const botMessage: ProofBotMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: response.text,
        timestamp: new Date(),
        mode: response.audioUrl ? 'voice' : 'text',
        audioUrl: response.audioUrl,
        urgent: response.urgent,
      };

      setMessages(prev => [...prev, botMessage]);

      // Handle actions
      if (response.actions) {
        response.actions.forEach(action => {
          switch (action.type) {
            case 'navigate':
              window.location.href = action.payload.route;
              break;
            case 'call_function':
              // Handle function calls
              console.log('ProofBot action:', action.payload);
              break;
            case 'show_guide':
              // Show guide modal or tooltip
              toast.success(`Guide: ${action.payload.guide}`);
              break;
          }
        });
      }

      // Auto-play voice response in crisis mode
      if (response.audioUrl && (crisisMode.isEnabled || voiceMode)) {
        const audio = new Audio(response.audioUrl);
        audio.play().catch(console.error);
      }

    } catch (error) {
      console.error('ProofBot message failed:', error);
      
      // Add error message
      const errorMessage: ProofBotMessage = {
        id: `error_${Date.now()}`,
        type: 'bot',
        content: "I'm having trouble connecting right now. I'm still here to help with emergency guidance, evidence upload, and blockchain verification. Please try again.",
        timestamp: new Date(),
        mode: 'text',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      await voiceService.startRecording();
      setIsRecording(true);
      toast.success('Listening... Speak now');
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      const audioBlob = await voiceService.stopRecording();
      setIsRecording(false);
      
      // Transcribe audio (this will use OpenAI Whisper or fallback)
      const transcription = await voiceService.transcribeAudio(audioBlob);
      
      if (transcription) {
        await sendMessage(transcription, 'voice', audioBlob);
      } else {
        toast.error('Could not understand audio');
      }
    } catch (error) {
      setIsRecording(false);
      toast.error('Voice recording failed');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const playAudioMessage = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const getMessageIcon = (message: ProofBotMessage) => {
    if (message.urgent) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (message.mode === 'voice') return <Volume2 className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Widget button when closed
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 ${className}`}
      >
        <MessageSquare className="h-6 w-6" />
        {crisisMode.isEnabled && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 ${className}`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${
        crisisMode.isEnabled ? 'bg-red-50' : 'bg-gradient-to-r from-blue-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              crisisMode.isEnabled ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ProofBot</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span>AI Assistant</span>
                {crisisMode.isEnabled && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Crisis Mode</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="de">🇩🇪 DE</option>
              <option value="uk">🇺🇦 UK</option>
              <option value="ar">🇸🇦 AR</option>
            </select>

            {/* Voice Mode Toggle */}
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={`p-1 rounded ${voiceMode ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}
              title="Voice mode"
            >
              <Volume2 className="h-3 w-3" />
            </button>

            {/* Minimize/Maximize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </button>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="h-80 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.urgent
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && getMessageIcon(message)}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      {message.audioUrl && (
                        <button
                          onClick={() => playAudioMessage(message.audioUrl!)}
                          className="mt-2 flex items-center space-x-1 text-xs opacity-75 hover:opacity-100"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Play Audio</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs mt-1 opacity-75`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">ProofBot is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="p-4 border-t border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={crisisMode.isEnabled ? "Describe your emergency..." : "Ask ProofBot anything..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={isProcessing || isRecording}
                />
                {isRecording && (
                  <div className="absolute inset-0 bg-red-50 border border-red-300 rounded-lg flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Listening...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Voice Button */}
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                disabled={isProcessing}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              
              {/* Send Button */}
              <button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isProcessing || isRecording}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { text: "Report Emergency", urgent: true },
                  { text: "Upload Evidence", urgent: false },
                  { text: "Blockchain Help", urgent: false },
                  { text: "Offline Sync", urgent: false },
                ].map((action) => (
                  <button
                    key={action.text}
                    onClick={() => sendMessage(action.text)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      action.urgent
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            )}

            {/* Status Indicators */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>ProofBot Online</span>
                </div>
                {crisisMode.isEnabled && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Zap className="h-3 w-3" />
                    <span>Offline Ready</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>{currentLanguage.toUpperCase()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProofBotWidget;