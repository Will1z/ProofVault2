// Pinata IPFS Service
// This service handles file uploads to IPFS via Pinata

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

interface PinataConfig {
  apiKey: string;
  apiSecret: string;
  jwt: string;
  endpoint: string;
}

class PinataService {
  private config: PinataConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_PINATA_API_KEY || '35bbfc8de2d3c515f5b7',
      apiSecret: import.meta.env.VITE_PINATA_API_SECRET || '886f45008c260fe955f34457127c15228d760e7ac375524c42090ac1a14481f8',
      jwt: import.meta.env.VITE_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxNjZkMGJjNy0zMmExLTRkMDQtODMzMC04Y2EzZGFmNmYxNzMiLCJlbWFpbCI6ImRhdmlkb2x1cmluZGVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjM1YmJmYzhkZTJkM2M1MTVmNWI3Iiwic2NvcGVkS2V5U2VjcmV0IjoiODg2ZjQ1MDA4YzI2MGZlOTU1ZjM0NDU3MTI3YzE1MjI4ZDc2MGU3YWMzNzU1MjRjNDIwOTBhYzFhMTQ0ODFmOCIsImV4cCI6MTc4MjA4NzgxM30.ZmoxOSzaBayomrQD1MF96peREElLv9lnuj86mIxRKNM',
      endpoint: 'https://api.pinata.cloud',
    };

    console.log('Pinata Service initialized:', {
      hasApiKey: !!this.config.apiKey,
      hasJWT: !!this.config.jwt,
      endpoint: this.config.endpoint,
    });
  }

  async uploadFile(file: File, options: {
    name?: string;
    keyvalues?: Record<string, string>;
  } = {}): Promise<PinataUploadResponse> {
    console.log(`Uploading file to Pinata: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      const metadata = {
        name: options.name || file.name,
        keyvalues: {
          app: 'ProofVault',
          type: 'emergency_evidence',
          timestamp: new Date().toISOString(),
          ...options.keyvalues,
        },
      };
      
      formData.append('pinataMetadata', JSON.stringify(metadata));
      
      // Add pin options for better organization
      const pinOptions = {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            { id: 'FRA1', desiredReplicationCount: 1 },
            { id: 'NYC1', desiredReplicationCount: 1 },
          ],
        },
      };
      
      formData.append('pinataOptions', JSON.stringify(pinOptions));

      const response = await fetch(`${this.config.endpoint}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Pinata upload successful:', result.IpfsHash);
      
      return {
        IpfsHash: result.IpfsHash,
        PinSize: result.PinSize,
        Timestamp: result.Timestamp,
        isDuplicate: result.isDuplicate,
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      
      // Fallback to mock IPFS for development/demo
      console.warn('Using mock IPFS hash due to error');
      return this.generateMockResponse(file);
    }
  }

  async uploadBuffer(buffer: ArrayBuffer, filename: string, mimeType: string, options: {
    name?: string;
    keyvalues?: Record<string, string>;
  } = {}): Promise<PinataUploadResponse> {
    try {
      console.log(`Uploading buffer to Pinata: ${filename} (${(buffer.byteLength / 1024).toFixed(2)} KB)`);
      
      const blob = new Blob([buffer], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });
      
      return await this.uploadFile(file, options);
    } catch (error) {
      console.error('Pinata buffer upload error:', error);
      throw error;
    }
  }

  async uploadJSON(data: any, filename: string, options: {
    name?: string;
    keyvalues?: Record<string, string>;
  } = {}): Promise<PinataUploadResponse> {
    try {
      console.log(`Uploading JSON to Pinata: ${filename}`);
      
      const response = await fetch(`${this.config.endpoint}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.jwt}`,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: options.name || filename,
            keyvalues: {
              app: 'ProofVault',
              type: 'json_data',
              timestamp: new Date().toISOString(),
              ...options.keyvalues,
            },
          },
          pinataOptions: {
            cidVersion: 1,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Pinata JSON upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Pinata JSON upload successful:', result.IpfsHash);
      
      return {
        IpfsHash: result.IpfsHash,
        PinSize: result.PinSize,
        Timestamp: result.Timestamp,
        isDuplicate: result.isDuplicate,
      };
    } catch (error) {
      console.error('Pinata JSON upload error:', error);
      throw error;
    }
  }

  async getFileInfo(ipfsHash: string): Promise<{ 
    ipfsHash: string;
    size: number;
    timestamp: string;
    metadata?: any;
  }> {
    try {
      const response = await fetch(`${this.config.endpoint}/data/pinList?hashContains=${ipfsHash}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.rows && result.rows.length > 0) {
        const pin = result.rows[0];
        return {
          ipfsHash: pin.ipfs_pin_hash,
          size: pin.size,
          timestamp: pin.date_pinned,
          metadata: pin.metadata,
        };
      }
      
      throw new Error('File not found');
    } catch (error) {
      console.error('Pinata file info error:', error);
      
      // Return basic info for unknown files
      return {
        ipfsHash,
        size: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async unpinFile(ipfsHash: string): Promise<boolean> {
    try {
      console.log(`Unpinning file from Pinata: ${ipfsHash}`);
      
      const response = await fetch(`${this.config.endpoint}/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`,
        },
      });

      if (response.ok) {
        console.log(`Successfully unpinned file: ${ipfsHash}`);
        return true;
      } else {
        console.warn(`Failed to unpin file: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('Pinata unpin error:', error);
      return false;
    }
  }

  async listPinnedFiles(options: {
    status?: 'pinned' | 'unpinned';
    pageLimit?: number;
    pageOffset?: number;
    metadata?: Record<string, string>;
  } = {}): Promise<{
    count: number;
    rows: Array<{
      ipfs_pin_hash: string;
      size: number;
      date_pinned: string;
      metadata: any;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options.status) params.append('status', options.status);
      if (options.pageLimit) params.append('pageLimit', options.pageLimit.toString());
      if (options.pageOffset) params.append('pageOffset', options.pageOffset.toString());
      
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          params.append(`metadata[keyvalues][${key}]`, value);
        });
      }

      const response = await fetch(`${this.config.endpoint}/data/pinList?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list pinned files: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Pinata list files error:', error);
      return { count: 0, rows: [] };
    }
  }

  private generateMockResponse(file: File): PinataUploadResponse {
    // Generate a realistic-looking IPFS hash for development
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    console.log(`Generated mock IPFS hash: ${mockHash}`);
    
    return {
      IpfsHash: mockHash,
      PinSize: file.size,
      Timestamp: new Date().toISOString(),
      isDuplicate: false,
    };
  }

  // Utility method to check if Pinata is properly configured
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.jwt);
  }

  // Get the IPFS gateway URL for a hash
  getGatewayUrl(ipfsHash: string, gateway = 'https://gateway.pinata.cloud/ipfs'): string {
    return `${gateway}/${ipfsHash}`;
  }

  // Get multiple gateway URLs for better availability
  getGatewayUrls(ipfsHash: string): string[] {
    const gateways = [
      'https://gateway.pinata.cloud/ipfs',
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      'https://dweb.link/ipfs',
    ];
    
    return gateways.map(gateway => `${gateway}/${ipfsHash}`);
  }

  // Get service status
  async getStatus(): Promise<{ online: boolean; version?: string; network?: string }> {
    try {
      const response = await fetch(`${this.config.endpoint}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        return {
          online: true,
          version: 'Pinata API v1',
          network: 'IPFS',
        };
      }
    } catch (error) {
      console.error('Pinata status check failed:', error);
    }

    return { online: false };
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured(),
      apiKey: this.config.apiKey ? this.config.apiKey.substring(0, 8) + '...' : 'Not set',
      hasJWT: !!this.config.jwt,
      endpoint: this.config.endpoint,
    };
  }
}

export const pinataService = new PinataService();
export type { PinataUploadResponse };