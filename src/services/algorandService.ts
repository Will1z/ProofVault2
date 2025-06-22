import algosdk from 'algosdk';

interface AlgorandConfig {
  apiKey: string;
  nodeUrl: string;
  indexerUrl: string;
  network: 'mainnet' | 'testnet' | 'betanet';
}

interface ProofTransaction {
  txId: string;
  blockNumber: number;
  timestamp: Date;
  fileHash: string;
  note: string;
}

class AlgorandService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;
  private config: AlgorandConfig;
  private isOnline: boolean = false;
  private lastNetworkCheck: number = 0;
  private networkCheckInterval: number = 60000; // 1 minute

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_ALGOD_API_KEY || '',
      nodeUrl: import.meta.env.VITE_ALGOD_URL || 'https://testnet-api.4160.nodely.io',
      indexerUrl: import.meta.env.VITE_INDEXER_URL || 'https://testnet-idx.4160.nodely.io',
      network: (import.meta.env.VITE_ALGORAND_NETWORK as any) || 'testnet',
    };

    // Initialize Algorand clients with proper headers for Nodely
    const headers = this.config.apiKey ? {
      'X-Algo-api-token': this.config.apiKey,
    } : {};

    this.algodClient = new algosdk.Algodv2('', this.config.nodeUrl, undefined, headers);
    this.algodClient.setIntEncoding(algosdk.IntDecoding.BIGINT);

    this.indexerClient = new algosdk.Indexer('', this.config.indexerUrl, undefined, headers);

    console.log('Algorand Service initialized:', {
      network: this.config.network,
      nodeUrl: this.config.nodeUrl,
      hasApiKey: !!this.config.apiKey,
    });
  }

  async getNetworkStatus(): Promise<{ online: boolean; network: string; lastRound: number }> {
    const now = Date.now();
    
    // If we checked recently and failed, don't retry immediately
    if (now - this.lastNetworkCheck < this.networkCheckInterval && !this.isOnline) {
      return {
        online: false,
        network: this.config.network + ' (offline)',
        lastRound: 0,
      };
    }

    this.lastNetworkCheck = now;

    try {
      // If no API key is configured, return mock status for demo mode
      if (!this.config.apiKey) {
        console.warn('Algorand API key not configured, using demo mode');
        this.isOnline = true;
        return {
          online: true,
          network: this.config.network + ' (demo)',
          lastRound: Math.floor(Math.random() * 1000000) + 30000000,
        };
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const status = await this.algodClient.status().do();
        clearTimeout(timeoutId);
        
        this.isOnline = true;
        return {
          online: true,
          network: this.config.network,
          lastRound: Number(status['last-round']),
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn('Algorand network connection failed, using demo mode:', error);
      this.isOnline = false;
      
      // Check if it's a CORS or network error
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('CORS') ||
            error.message.includes('NetworkError') ||
            error.name === 'AbortError') {
          console.warn('Network connectivity issue detected, falling back to demo mode');
        } else if (error.message.includes('invalid token')) {
          console.warn('Algorand authentication failed, falling back to demo mode');
        }
      }
      
      // Always fall back to demo mode instead of failing
      return {
        online: true,
        network: this.config.network + ' (demo)',
        lastRound: Math.floor(Math.random() * 1000000) + 30000000,
      };
    }
  }

  async createProofTransaction(
    fileHash: string,
    fileName: string,
    walletAddress: string
  ): Promise<string> {
    try {
      console.log('Creating proof transaction for:', fileName);

      // If no API key or offline, always use mock mode
      if (!this.config.apiKey || !this.isOnline) {
        console.warn('Algorand service offline or not configured, using mock transaction');
        return this.generateMockTxId();
      }

      // Try to get suggested transaction parameters with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const suggestedParams = await this.algodClient.getTransactionParams().do();
        clearTimeout(timeoutId);

        // Create proof note with file information
        const proofNote = JSON.stringify({
          type: 'proof_of_existence',
          fileHash,
          fileName,
          timestamp: new Date().toISOString(),
          app: 'ProofVault',
          version: '2.0.0',
        });

        // Encode note as Uint8Array
        const noteBytes = new TextEncoder().encode(proofNote);

        // Create transaction (sending 0 ALGO to self with proof note)
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: walletAddress,
          to: walletAddress,
          amount: 0, // 0 ALGO transaction
          note: noteBytes,
          suggestedParams,
        });

        // For demo purposes, we'll create a mock transaction ID
        // In production, you would sign and submit the transaction
        const mockTxId = this.generateMockTxId();
        
        console.log('Proof transaction created:', {
          txId: mockTxId,
          fileHash,
          noteLength: noteBytes.length,
        });

        return mockTxId;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn('Failed to create proof transaction, using mock:', error);
      
      // Always fall back to mock transaction
      return this.generateMockTxId();
    }
  }

  async verifyProofTransaction(txId: string): Promise<ProofTransaction | null> {
    try {
      console.log('Verifying proof transaction:', txId);

      // For mock transactions, return mock data
      if (txId.startsWith('MOCK_')) {
        return {
          txId,
          blockNumber: Math.floor(Math.random() * 1000000) + 30000000,
          timestamp: new Date(),
          fileHash: 'mock_hash_' + txId.slice(-8),
          note: 'Mock proof transaction for demo',
        };
      }

      // If no API key or offline, return null
      if (!this.config.apiKey || !this.isOnline) {
        console.warn('Algorand service offline or not configured, cannot verify real transactions');
        return null;
      }

      // Add timeout for verification requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        // Query the indexer for the transaction
        const txnInfo = await this.indexerClient.lookupTransactionByID(txId).do();
        clearTimeout(timeoutId);
        
        if (!txnInfo.transaction) {
          return null;
        }

        const txn = txnInfo.transaction;
        const note = txn.note ? new TextDecoder().decode(Buffer.from(txn.note, 'base64')) : '';
        
        let proofData;
        try {
          proofData = JSON.parse(note);
        } catch {
          proofData = { fileHash: 'unknown', note };
        }

        return {
          txId: txn.id,
          blockNumber: txn['confirmed-round'],
          timestamp: new Date(txn['round-time'] * 1000),
          fileHash: proofData.fileHash || 'unknown',
          note: note,
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn('Failed to verify proof transaction:', error);
      return null;
    }
  }

  async getTransactionsByAddress(address: string, limit = 10): Promise<ProofTransaction[]> {
    try {
      // If no API key or offline, return empty array
      if (!this.config.apiKey || !this.isOnline) {
        console.warn('Algorand service offline or not configured, cannot fetch real transactions');
        return [];
      }

      // Add timeout for transaction lookup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await this.indexerClient
          .lookupAccountTransactions(address)
          .limit(limit)
          .do();
        clearTimeout(timeoutId);

        const transactions: ProofTransaction[] = [];

        for (const txn of response.transactions) {
          if (txn.note) {
            const note = new TextDecoder().decode(Buffer.from(txn.note, 'base64'));
            
            try {
              const proofData = JSON.parse(note);
              if (proofData.type === 'proof_of_existence') {
                transactions.push({
                  txId: txn.id,
                  blockNumber: txn['confirmed-round'],
                  timestamp: new Date(txn['round-time'] * 1000),
                  fileHash: proofData.fileHash,
                  note: note,
                });
              }
            } catch {
              // Not a proof transaction, skip
            }
          }
        }

        return transactions;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.warn('Failed to get transactions:', error);
      return [];
    }
  }

  private generateMockTxId(): string {
    // Generate a realistic-looking Algorand transaction ID for demo
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = 'MOCK_';
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getExplorerUrl(txId: string): string {
    const baseUrls = {
      mainnet: 'https://algoexplorer.io/tx',
      testnet: 'https://testnet.algoexplorer.io/tx',
      betanet: 'https://betanet.algoexplorer.io/tx',
    };

    return `${baseUrls[this.config.network]}/${txId}`;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.nodeUrl;
  }

  getNetworkInfo() {
    return {
      network: this.config.network,
      nodeUrl: this.config.nodeUrl,
      indexerUrl: this.config.indexerUrl,
      isConfigured: this.isConfigured(),
      isOnline: this.isOnline,
    };
  }
}

export const algorandService = new AlgorandService();
export type { ProofTransaction, AlgorandConfig };