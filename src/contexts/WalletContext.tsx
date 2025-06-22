import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { algorandService } from '../services/algorandService';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  networkStatus: {
    online: boolean;
    network: string;
    lastRound: number;
  };
  refreshNetworkStatus: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState({
    online: false,
    network: 'testnet',
    lastRound: 0,
  });

  const refreshNetworkStatus = async () => {
    try {
      const status = await algorandService.getNetworkStatus();
      setNetworkStatus(status);
    } catch (error) {
      console.warn('Network status check failed, using offline mode:', error);
      setNetworkStatus(prev => ({ 
        ...prev, 
        online: false,
        network: prev.network + ' (offline)'
      }));
    }
  };

  useEffect(() => {
    // Check network status on mount (with error handling)
    refreshNetworkStatus().catch(error => {
      console.warn('Initial network status check failed:', error);
    });

    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setIsConnected(true);
    }

    // Refresh network status every 60 seconds (increased from 30 to reduce API calls)
    const interval = setInterval(() => {
      refreshNetworkStatus().catch(error => {
        console.warn('Periodic network status check failed:', error);
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    try {
      // Check if Algorand service is configured
      if (!algorandService.isConfigured()) {
        console.warn('Algorand service not fully configured, using demo mode');
      }

      // For demo purposes, we'll simulate wallet connection
      // In production, integrate with actual Algorand wallet providers like:
      // - Pera Wallet
      // - MyAlgo Wallet
      // - WalletConnect
      
      const mockAddress = 'DEMO' + Math.random().toString(36).substring(2, 15).toUpperCase();
      setWalletAddress(mockAddress);
      setIsConnected(true);
      localStorage.setItem('walletAddress', mockAddress);
      
      // Refresh network status after connection (with error handling)
      try {
        await refreshNetworkStatus();
      } catch (error) {
        console.warn('Failed to refresh network status after wallet connection:', error);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    localStorage.removeItem('walletAddress');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        connectWallet,
        disconnectWallet,
        networkStatus,
        refreshNetworkStatus,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};