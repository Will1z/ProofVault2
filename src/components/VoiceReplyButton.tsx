import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2, Volume2, AudioWaveform as Waveform } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceService, VoiceReply } from '../services/voiceService';
import { useEmergency } from '../contexts/EmergencyContext';
import toast from 'react-hot-toast';

interface VoiceReplyButtonProps {
  threadId: string;
  onVoiceReply?: (reply: VoiceReply) => void;
  disabled?: boolean;
}

const VoiceReplyButton: React.FC<VoiceReplyButtonProps> = ({ 
  threadId, 
  onVoiceReply,
  disabled = false 
}) => {
  const { sendMessage } = useEmergency();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastReply, setLastReply] = useState<VoiceReply | null>(null);
  
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      await voiceService.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Setup audio level monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      toast.success('Recording started');
      
    } catch (error) {
      toast.error('Failed to start recording');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const audioBlob = await voiceService.stopRecording();
      setIsRecording(false);
      setIsProcessing(true);
      setAudioLevel(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Process the voice reply
      const reply = await voiceService.processVoiceReply(
        audioBlob,
        threadId,
        'responder_user', // Mock responder ID
        'Emergency Responder'
      );
      
      setLastReply(reply);
      
      // Send both the voice message and AI-enhanced text to chat
      sendMessage(threadId, reply.aiEnhanced, 'voice');
      
      // Notify parent component
      onVoiceReply?.(reply);
      
      toast.success('Voice reply processed and sent');
      
    } catch (error) {
      toast.error('Failed to process voice reply');
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playLastReply = () => {
    if (lastReply) {
      const audio = new Audio(URL.createObjectURL(lastReply.audioBlob));
      audio.play();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Recording Button */}
      <div className="relative">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className={`relative p-3 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-600 text-white shadow-lg scale-110'
              : isProcessing
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
          
          {/* Audio level indicator */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-red-300"
              animate={{
                scale: 1 + audioLevel * 0.3,
                opacity: 0.7 + audioLevel * 0.3,
              }}
              transition={{ duration: 0.1 }}
            />
          )}
        </button>
        
        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>{formatTime(recordingTime)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing voice...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last reply playback */}
      {lastReply && !isRecording && !isProcessing && (
        <button
          onClick={playLastReply}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Play last voice reply"
        >
          <Volume2 className="h-4 w-4" />
        </button>
      )}

      {/* Voice reply info */}
      <AnimatePresence>
        {lastReply && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-xs"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Waveform className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Voice Reply Sent</span>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                [AI-enhanced]
              </span>
            </div>
            <p className="text-sm text-green-700 mb-2">{lastReply.aiEnhanced}</p>
            <div className="flex items-center justify-between text-xs text-green-600">
              <span>Processed in {lastReply.processingTime.toFixed(1)}s</span>
              <span>{lastReply.timestamp.toLocaleTimeString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceReplyButton;