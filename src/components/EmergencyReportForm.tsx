import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mic, Camera, FileText, AlertTriangle, Send, MicOff } from 'lucide-react';
import { EmergencyType } from '../types/emergency';
import { useEmergency } from '../contexts/EmergencyContext';
import { twilioService } from '../services/twilioService';
import ConsentCheckbox from './ConsentCheckbox';
import toast from 'react-hot-toast';

interface EmergencyReportFormProps {
  onSubmit?: (reportId: string) => void;
  onCancel?: () => void;
}

const EmergencyReportForm: React.FC<EmergencyReportFormProps> = ({ onSubmit, onCancel }) => {
  const { createReport, processVoiceCommand, responders } = useEmergency();
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [consented, setConsented] = useState(false);
  const [formData, setFormData] = useState({
    type: 'other' as EmergencyType,
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    isAnonymous: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const emergencyTypes = [
    { value: 'fire', label: 'Fire', icon: '🔥', color: 'red' },
    { value: 'medical', label: 'Medical', icon: '🚑', color: 'red' },
    { value: 'flood', label: 'Flood', icon: '🌊', color: 'blue' },
    { value: 'earthquake', label: 'Earthquake', icon: '🏗️', color: 'orange' },
    { value: 'accident', label: 'Accident', icon: '🚗', color: 'yellow' },
    { value: 'violence', label: 'Violence', icon: '⚠️', color: 'red' },
    { value: 'missing_person', label: 'Missing Person', icon: '👤', color: 'purple' },
    { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️', color: 'gray' },
    { value: 'hazmat', label: 'Hazmat', icon: '☢️', color: 'orange' },
    { value: 'other', label: 'Other', icon: '❓', color: 'gray' },
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast.success('Location captured');
      },
      (error) => {
        toast.error('Failed to get location');
        console.error('Geolocation error:', error);
      }
    );
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        try {
          const result = await processVoiceCommand(audioBlob);
          setFormData(prev => ({
            ...prev,
            description: prev.description + ' ' + result.text,
          }));
          
          // Auto-detect emergency type from voice
          if (result.action?.includes('fire')) {
            setFormData(prev => ({ ...prev, type: 'fire' }));
          } else if (result.action?.includes('medical')) {
            setFormData(prev => ({ ...prev, type: 'medical' }));
          }
          
          toast.success('Voice processed successfully');
        } catch (error) {
          toast.error('Failed to process voice');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      toast.error('Location is required');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    if (!consented) {
      toast.error('You must consent to data processing for emergency response');
      return;
    }

    try {
      const reportId = await createReport({
        ...formData,
        location,
        status: 'active',
        urgencyScore: formData.severity === 'critical' ? 10 : 
                     formData.severity === 'high' ? 8 :
                     formData.severity === 'medium' ? 5 : 3,
        responders: [],
        media: [],
      });

      // Send SMS alerts to available responders
      const availableResponders = responders.filter(r => r.isAvailable && r.contactInfo?.phone);
      if (availableResponders.length > 0) {
        const contacts = availableResponders.map(r => r.contactInfo!.phone!);
        await twilioService.notifyResponders({
          id: reportId,
          title: formData.title,
          severity: formData.severity,
          location,
        }, contacts);
      }

      toast.success('Emergency report submitted and responders notified');
      onSubmit?.(reportId);
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNum <= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  stepNum < step ? 'bg-red-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Emergency Type</span>
          <span>Details</span>
          <span>Consent</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step 1: Emergency Type */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What's the emergency?</h2>
            <p className="text-gray-600">Select the type of emergency you're reporting</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {emergencyTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFormData(prev => ({ ...prev, type: type.value as EmergencyType }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === type.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium text-gray-900">{type.label}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Provide details</h2>
            <p className="text-gray-600">Help responders understand the situation</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the emergency"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of what's happening..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`absolute bottom-2 right-2 p-2 rounded-lg ${
                    isRecording ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              {isRecording && (
                <p className="text-sm text-red-600 mt-1">Recording... Click to stop</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="low">Low - Minor issue</option>
                <option value="medium">Medium - Moderate concern</option>
                <option value="high">High - Serious situation</option>
                <option value="critical">Critical - Life threatening</option>
              </select>
            </div>

            <div>
              <button
                onClick={getCurrentLocation}
                className={`w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed rounded-lg transition-colors ${
                  location ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <MapPin className="h-5 w-5" />
                <span>
                  {location ? 'Location captured ✓' : 'Capture current location *'}
                </span>
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                Report anonymously (for safety)
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.title.trim() || !formData.description.trim() || !location}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Consent */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Consent</h2>
            <p className="text-gray-600">Please review and consent to data processing for emergency response</p>
          </div>

          <ConsentCheckbox
            onConsentChange={setConsented}
            required={true}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          />

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!consented}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review your report</h2>
            <p className="text-gray-600">Make sure all information is accurate</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Emergency Type</h3>
              <p className="text-gray-600 capitalize">{formData.type.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Title</h3>
              <p className="text-gray-600">{formData.title}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Description</h3>
              <p className="text-gray-600">{formData.description}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Severity</h3>
              <p className={`capitalize font-medium ${
                formData.severity === 'critical' ? 'text-red-600' :
                formData.severity === 'high' ? 'text-orange-600' :
                formData.severity === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {formData.severity}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Location</h3>
              <p className="text-gray-600">
                {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Not captured'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Reporting</h3>
              <p className="text-gray-600">
                {formData.isAnonymous ? 'Anonymous report' : 'Identified report'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Data Consent</h3>
              <p className="text-green-600">✓ Consented to emergency data processing</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Send className="h-4 w-4" />
              <span>Submit Emergency Report</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EmergencyReportForm;