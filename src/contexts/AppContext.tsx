import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface ProofRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileHash: string;
  ipfsHash: string;
  summary: string;
  transcript?: string;
  algorandTxId: string;
  uploadDate: Date;
  walletAddress: string;
  status: 'processing' | 'completed' | 'failed';
}

interface AppContextType {
  proofs: ProofRecord[];
  addProof: (proof: ProofRecord) => Promise<void>;
  updateProof: (id: string, updates: Partial<ProofRecord>) => Promise<void>;
  getProof: (id: string) => ProofRecord | undefined;
  loadProofs: () => Promise<void>;
  isLoading: boolean;
  isOfflineMode: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [proofs, setProofs] = useState<ProofRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured());

  const loadProofs = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured - running in offline mode');
      setIsOfflineMode(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase!
        .from('proof_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const formattedProofs: ProofRecord[] = data.map(record => ({
        id: record.id,
        fileName: record.file_name,
        fileType: record.file_type,
        fileHash: record.file_hash,
        ipfsHash: record.ipfs_hash,
        summary: record.summary,
        transcript: record.transcript,
        algorandTxId: record.algorand_tx_id,
        uploadDate: new Date(record.upload_date),
        walletAddress: record.wallet_address,
        status: record.status as 'processing' | 'completed' | 'failed',
      }));

      setProofs(formattedProofs);
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Error loading proofs:', error);
      
      // Check if it's a network/configuration error
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        console.log('Database connection failed - switching to offline mode');
        setIsOfflineMode(true);
        toast.error('Database not available - running in offline mode');
      } else {
        toast.error('Failed to load proof records');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addProof = async (proof: ProofRecord) => {
    if (!isSupabaseConfigured()) {
      console.log('Adding proof in offline mode');
      setProofs(prev => [proof, ...prev]);
      toast.success('Proof record saved locally (offline mode)');
      return;
    }

    try {
      const { error } = await supabase!
        .from('proof_records')
        .insert({
          id: proof.id,
          file_name: proof.fileName,
          file_type: proof.fileType,
          file_hash: proof.fileHash,
          ipfs_hash: proof.ipfsHash,
          summary: proof.summary,
          transcript: proof.transcript,
          algorand_tx_id: proof.algorandTxId,
          upload_date: proof.uploadDate.toISOString(),
          wallet_address: proof.walletAddress,
          status: proof.status,
        });

      if (error) throw error;

      setProofs(prev => [proof, ...prev]);
      toast.success('Proof record saved to database');
    } catch (error) {
      console.error('Error saving proof:', error);
      
      // Still add to local state for offline functionality
      setProofs(prev => [proof, ...prev]);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        setIsOfflineMode(true);
        toast.success('Proof record saved locally (offline mode)');
      } else {
        toast.error('Failed to save proof record to database');
      }
    }
  };

  const updateProof = async (id: string, updates: Partial<ProofRecord>) => {
    if (!isSupabaseConfigured()) {
      console.log('Updating proof in offline mode');
      setProofs(prev =>
        prev.map(proof => (proof.id === id ? { ...proof, ...updates } : proof))
      );
      return;
    }

    try {
      const dbUpdates: any = {};
      if (updates.fileName) dbUpdates.file_name = updates.fileName;
      if (updates.fileType) dbUpdates.file_type = updates.fileType;
      if (updates.fileHash) dbUpdates.file_hash = updates.fileHash;
      if (updates.ipfsHash) dbUpdates.ipfs_hash = updates.ipfsHash;
      if (updates.summary) dbUpdates.summary = updates.summary;
      if (updates.transcript !== undefined) dbUpdates.transcript = updates.transcript;
      if (updates.algorandTxId) dbUpdates.algorand_tx_id = updates.algorandTxId;
      if (updates.uploadDate) dbUpdates.upload_date = updates.uploadDate.toISOString();
      if (updates.walletAddress) dbUpdates.wallet_address = updates.walletAddress;
      if (updates.status) dbUpdates.status = updates.status;

      const { error } = await supabase!
        .from('proof_records')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setProofs(prev =>
        prev.map(proof => (proof.id === id ? { ...proof, ...updates } : proof))
      );
    } catch (error) {
      console.error('Error updating proof:', error);
      
      // Still update local state
      setProofs(prev =>
        prev.map(proof => (proof.id === id ? { ...proof, ...updates } : proof))
      );
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        setIsOfflineMode(true);
        toast.success('Proof record updated locally (offline mode)');
      } else {
        toast.error('Failed to update proof record in database');
      }
    }
  };

  const getProof = (id: string) => {
    return proofs.find(proof => proof.id === id);
  };

  // Load proofs on mount
  useEffect(() => {
    loadProofs();
  }, []);

  // Check Supabase configuration on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase environment variables not configured');
      console.log('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
      setIsOfflineMode(true);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        proofs,
        addProof,
        updateProof,
        getProof,
        loadProofs,
        isLoading,
        isOfflineMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};