import CryptoJS from 'crypto-js';
import { ProofRecord } from '../contexts/AppContext';
import { pinataService, PinataUploadResponse } from './pinataService';
import { algorandService } from './algorandService';

// Mock implementations for demonstration
// In production, these would connect to actual APIs

const generateSHA256 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const hash = CryptoJS.SHA256(wordArray).toString();
      resolve(hash);
    };
    reader.readAsArrayBuffer(file);
  });
};

const transcribeAudio = async (file: File): Promise<string> => {
  // Mock transcription - in production, use OpenAI Whisper API
  await new Promise(resolve => setTimeout(resolve, 2000));
  return `This is a mock transcription of the audio file "${file.name}". In production, this would be generated using OpenAI's Whisper API or ElevenLabs transcription service.`;
};

const analyzeContent = async (content: string, fileName: string): Promise<string> => {
  // Mock AI analysis - in production, use OpenAI GPT-4 API
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `AI Analysis Summary: This evidence file "${fileName}" contains important content that has been analyzed for key information, context, and potential significance. The content appears to be well-structured and contains relevant details that could be valuable for verification purposes. ${content ? 'Audio transcription reveals clear communication with important contextual information.' : 'Document content has been processed and summarized for easy reference.'}`;
};

const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    console.log('Uploading file to IPFS via Pinata...');
    const result: PinataUploadResponse = await pinataService.uploadFile(file, {
      name: `ProofVault_${file.name}`,
      keyvalues: {
        source: 'ProofVault',
        type: 'evidence',
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log('File uploaded to IPFS via Pinata:', result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

const recordOnAlgorand = async (
  fileHash: string,
  fileName: string,
  walletAddress: string
): Promise<string> => {
  try {
    console.log('Recording proof on Algorand blockchain...');
    
    // Check if Algorand service is configured
    if (!algorandService.isConfigured()) {
      console.warn('Algorand service not configured, using mock transaction');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return `MOCK_ALGO${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    }

    // Create proof transaction on Algorand
    const txId = await algorandService.createProofTransaction(
      fileHash,
      fileName,
      walletAddress
    );

    console.log('Proof recorded on Algorand:', txId);
    return txId;
  } catch (error) {
    console.error('Algorand recording failed:', error);
    // Fallback to mock for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `MOCK_ALGO${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  }
};

export const processFile = async (
  file: File,
  walletAddress: string,
  onProgress: (step: string) => void
): Promise<ProofRecord> => {
  const proofId = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Step 1: Generate file hash
  onProgress('hashing');
  const fileHash = await generateSHA256(file);
  
  // Step 2: Transcribe if audio
  let transcript: string | undefined;
  if (file.type.startsWith('audio/')) {
    onProgress('transcribing');
    transcript = await transcribeAudio(file);
  }
  
  // Step 3: AI analysis
  onProgress('analyzing');
  const summary = await analyzeContent(transcript || '', file.name);
  
  // Step 4: Upload to IPFS via Pinata
  onProgress('storing');
  const ipfsHash = await uploadToIPFS(file);
  
  // Step 5: Record on Algorand with real API
  onProgress('blockchain');
  const algorandTxId = await recordOnAlgorand(fileHash, file.name, walletAddress);

  // Step 6: Run verification analysis (new for Fake News Shield)
  onProgress('verification');
  // This would integrate with the verification context
  // For now, we'll just simulate the process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: proofId,
    fileName: file.name,
    fileType: file.type,
    fileHash,
    ipfsHash,
    summary,
    transcript,
    algorandTxId,
    uploadDate: new Date(),
    walletAddress,
    status: 'completed',
  };
};

// Enhanced file processor with verification
export const processFileWithVerification = async (
  file: File,
  walletAddress: string,
  onProgress: (step: string) => void,
  analyzeMedia: (file: File, fileId: string) => Promise<any>
): Promise<{ proofRecord: ProofRecord; verificationReport: any }> => {
  // Process file normally
  const proofRecord = await processFile(file, walletAddress, onProgress);
  
  // Run verification analysis
  onProgress('verification');
  const verificationReport = await analyzeMedia(file, proofRecord.id);
  
  return { proofRecord, verificationReport };
};

// Utility functions for IPFS operations
export const getIPFSUrl = (cid: string, gateway = 'https://gateway.pinata.cloud/ipfs'): string => {
  return pinataService.getGatewayUrl(cid, gateway);
};

export const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
  try {
    const filename = `metadata_${Date.now()}.json`;
    const result = await pinataService.uploadJSON(metadata, filename, {
      name: `ProofVault_Metadata_${Date.now()}`,
      keyvalues: {
        type: 'metadata',
        source: 'ProofVault',
      },
    });
    return result.IpfsHash;
  } catch (error) {
    console.error('Failed to upload metadata to IPFS:', error);
    throw error;
  }
};

export const uploadBufferToIPFS = async (
  buffer: ArrayBuffer, 
  filename: string, 
  mimeType: string
): Promise<string> => {
  try {
    const result = await pinataService.uploadBuffer(buffer, filename, mimeType, {
      name: `ProofVault_${filename}`,
      keyvalues: {
        type: 'buffer',
        source: 'ProofVault',
      },
    });
    return result.IpfsHash;
  } catch (error) {
    console.error('Failed to upload buffer to IPFS:', error);
    throw error;
  }
};