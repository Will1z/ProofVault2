import { pinataService } from './pinataService';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  ipfs_cid?: string;
}

class CloudinaryService {
  private config: CloudinaryConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
      apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || '',
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'proofvault_preset',
    };

    this.isConfigured = !!(this.config.cloudName && this.config.apiKey);
    
    if (this.isConfigured) {
      console.log('Cloudinary Service initialized:', {
        cloudName: this.config.cloudName,
        hasApiKey: !!this.config.apiKey,
        uploadPreset: this.config.uploadPreset,
      });
    } else {
      console.warn('Cloudinary not configured - using mock responses');
    }
  }

  async uploadFile(file: File, options?: {
    folder?: string;
    tags?: string[];
    transformation?: string;
    uploadToIPFS?: boolean;
  }): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured) {
      console.log('Cloudinary not configured, using mock response');
      return this.generateMockResponse(file, options?.uploadToIPFS);
    }

    try {
      console.log(`Uploading file to Cloudinary: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.config.uploadPreset!);
      
      if (options?.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options?.tags) {
        formData.append('tags', options.tags.join(','));
      }
      
      if (options?.transformation) {
        formData.append('transformation', options.transformation);
      }

      // Add ProofVault metadata
      formData.append('context', JSON.stringify({
        source: 'ProofVault',
        upload_time: new Date().toISOString(),
        file_name: file.name,
        file_size: file.size,
      }));

      const resourceType = this.getResourceType(file.type);
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${resourceType}/upload`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Cloudinary upload successful:', result.public_id);

      let ipfsCid: string | undefined;
      
      // Upload to IPFS via Pinata if requested
      if (options?.uploadToIPFS) {
        try {
          console.log('Also uploading to IPFS via Pinata...');
          const ipfsResult = await pinataService.uploadFile(file);
          ipfsCid = ipfsResult.cid;
          console.log('IPFS upload successful:', ipfsCid);
        } catch (ipfsError) {
          console.warn('IPFS upload failed, but Cloudinary upload succeeded:', ipfsError);
        }
      }

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        ipfs_cid: ipfsCid,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      
      // Fallback to mock for development
      if (!this.config.cloudName) {
        console.warn('Using mock Cloudinary response due to missing configuration');
        return this.generateMockResponse(file, options?.uploadToIPFS);
      }
      
      throw error;
    }
  }

  async uploadBuffer(
    buffer: ArrayBuffer, 
    filename: string, 
    mimeType: string,
    options?: {
      folder?: string;
      tags?: string[];
      uploadToIPFS?: boolean;
    }
  ): Promise<CloudinaryUploadResponse> {
    const blob = new Blob([buffer], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });
    return this.uploadFile(file, options);
  }

  async uploadJSON(
    data: any, 
    filename: string,
    options?: {
      folder?: string;
      tags?: string[];
      uploadToIPFS?: boolean;
    }
  ): Promise<CloudinaryUploadResponse> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });
    return this.uploadFile(file, options);
  }

  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'video'; // Cloudinary uses 'video' for audio
    return 'raw'; // For documents and other files
  }

  private generateMockResponse(file: File, uploadToIPFS?: boolean): CloudinaryUploadResponse {
    const mockPublicId = `proofvault/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`;
    const mockUrl = `https://res.cloudinary.com/demo/image/upload/${mockPublicId}`;
    
    console.log(`Generated mock Cloudinary response: ${mockPublicId}`);
    
    return {
      public_id: mockPublicId,
      secure_url: mockUrl,
      url: mockUrl,
      format: file.type.split('/')[1] || 'unknown',
      resource_type: this.getResourceType(file.type),
      bytes: file.size,
      width: file.type.startsWith('image/') ? 1920 : undefined,
      height: file.type.startsWith('image/') ? 1080 : undefined,
      duration: file.type.startsWith('video/') ? 30 : undefined,
      ipfs_cid: uploadToIPFS ? `Qm${Math.random().toString(36).substring(2, 15)}` : undefined,
    };
  }

  getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
  }): string {
    if (!this.isConfigured) {
      return `https://via.placeholder.com/${options?.width || 800}x${options?.height || 600}`;
    }

    let transformation = '';
    
    if (options) {
      const transformations = [];
      
      if (options.width) transformations.push(`w_${options.width}`);
      if (options.height) transformations.push(`h_${options.height}`);
      if (options.quality) transformations.push(`q_${options.quality}`);
      if (options.format) transformations.push(`f_${options.format}`);
      if (options.crop) transformations.push(`c_${options.crop}`);
      
      if (transformations.length > 0) {
        transformation = transformations.join(',') + '/';
      }
    }

    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformation}${publicId}`;
  }

  async deleteFile(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('Cloudinary not configured, simulating delete');
      return true;
    }

    try {
      // Note: Deletion requires server-side implementation due to signature requirements
      console.warn('File deletion requires server-side implementation for security');
      return false;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      cloudName: this.config.cloudName,
      hasApiKey: !!this.config.apiKey,
      uploadPreset: this.config.uploadPreset,
    };
  }
}

export const cloudinaryService = new CloudinaryService();
export type { CloudinaryUploadResponse };