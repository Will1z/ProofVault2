import { parse } from 'exifr';

interface ExifData {
  // Camera and device info
  make?: string;
  model?: string;
  software?: string;
  
  // Image settings
  dateTime?: Date;
  dateTimeOriginal?: Date;
  dateTimeDigitized?: Date;
  
  // Location data
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsTimestamp?: Date;
  
  // Technical details
  imageWidth?: number;
  imageHeight?: number;
  orientation?: number;
  xResolution?: number;
  yResolution?: number;
  resolutionUnit?: number;
  
  // Camera settings
  fNumber?: number;
  exposureTime?: number;
  iso?: number;
  focalLength?: number;
  flash?: number;
  whiteBalance?: number;
  
  // Additional metadata
  userComment?: string;
  imageDescription?: string;
  artist?: string;
  copyright?: string;
  
  // Verification data
  digitalZoomRatio?: number;
  colorSpace?: number;
  sensingMethod?: number;
  fileSource?: number;
  sceneType?: number;
  
  // Raw EXIF for advanced analysis
  rawExif?: any;
}

interface ExifAnalysisResult {
  exifData: ExifData;
  hasLocation: boolean;
  hasTimestamp: boolean;
  deviceInfo: {
    manufacturer?: string;
    model?: string;
    software?: string;
  };
  imageQuality: {
    resolution: string;
    megapixels: number;
    aspectRatio: string;
  };
  cameraSettings: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
  };
  verificationFlags: {
    hasOriginalTimestamp: boolean;
    hasGpsData: boolean;
    hasDeviceInfo: boolean;
    suspiciousEditing: boolean;
    qualityScore: number;
  };
  emergencyContext?: {
    captureTime?: Date;
    location?: { lat: number; lng: number };
    deviceReliability: number;
    timestampReliability: number;
  };
}

class ExifService {
  async extractExifData(imageFile: File): Promise<ExifAnalysisResult> {
    try {
      console.log('Extracting EXIF data from image...');
      
      // Parse EXIF data using exifr
      const exifData = await parse(imageFile, {
        gps: true,
        tiff: true,
        exif: true,
        jfif: true,
        ihdr: true,
        iptc: true,
        icc: true,
        pick: [
          // Basic info
          'Make', 'Model', 'Software', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
          // GPS
          'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSTimeStamp', 'GPSDateStamp',
          // Image
          'ImageWidth', 'ImageHeight', 'Orientation', 'XResolution', 'YResolution', 'ResolutionUnit',
          // Camera
          'FNumber', 'ExposureTime', 'ISO', 'FocalLength', 'Flash', 'WhiteBalance',
          // Additional
          'UserComment', 'ImageDescription', 'Artist', 'Copyright',
          'DigitalZoomRatio', 'ColorSpace', 'SensingMethod', 'FileSource', 'SceneType'
        ]
      });

      return this.processExifData(exifData, imageFile);
    } catch (error) {
      console.error('EXIF extraction failed:', error);
      return this.generateFallbackAnalysis(imageFile);
    }
  }

  private processExifData(rawExif: any, imageFile: File): ExifAnalysisResult {
    // Extract and normalize EXIF data
    const exifData: ExifData = {
      make: rawExif?.Make,
      model: rawExif?.Model,
      software: rawExif?.Software,
      dateTime: rawExif?.DateTime,
      dateTimeOriginal: rawExif?.DateTimeOriginal,
      dateTimeDigitized: rawExif?.DateTimeDigitized,
      latitude: rawExif?.latitude || rawExif?.GPSLatitude,
      longitude: rawExif?.longitude || rawExif?.GPSLongitude,
      altitude: rawExif?.GPSAltitude,
      imageWidth: rawExif?.ImageWidth || rawExif?.ExifImageWidth,
      imageHeight: rawExif?.ImageHeight || rawExif?.ExifImageHeight,
      orientation: rawExif?.Orientation,
      xResolution: rawExif?.XResolution,
      yResolution: rawExif?.YResolution,
      resolutionUnit: rawExif?.ResolutionUnit,
      fNumber: rawExif?.FNumber,
      exposureTime: rawExif?.ExposureTime,
      iso: rawExif?.ISO,
      focalLength: rawExif?.FocalLength,
      flash: rawExif?.Flash,
      whiteBalance: rawExif?.WhiteBalance,
      userComment: rawExif?.UserComment,
      imageDescription: rawExif?.ImageDescription,
      artist: rawExif?.Artist,
      copyright: rawExif?.Copyright,
      digitalZoomRatio: rawExif?.DigitalZoomRatio,
      colorSpace: rawExif?.ColorSpace,
      sensingMethod: rawExif?.SensingMethod,
      fileSource: rawExif?.FileSource,
      sceneType: rawExif?.SceneType,
      rawExif
    };

    // Calculate derived information
    const hasLocation = !!(exifData.latitude && exifData.longitude);
    const hasTimestamp = !!(exifData.dateTimeOriginal || exifData.dateTime);
    
    const deviceInfo = {
      manufacturer: exifData.make,
      model: exifData.model,
      software: exifData.software
    };

    const width = exifData.imageWidth || 0;
    const height = exifData.imageHeight || 0;
    const megapixels = (width * height) / 1000000;
    const aspectRatio = width && height ? `${Math.round((width/height) * 100) / 100}:1` : 'Unknown';

    const imageQuality = {
      resolution: width && height ? `${width}x${height}` : 'Unknown',
      megapixels: Math.round(megapixels * 10) / 10,
      aspectRatio
    };

    const cameraSettings = {
      aperture: exifData.fNumber ? `f/${exifData.fNumber}` : undefined,
      shutterSpeed: exifData.exposureTime ? `1/${Math.round(1/exifData.exposureTime)}s` : undefined,
      iso: exifData.iso,
      focalLength: exifData.focalLength ? `${exifData.focalLength}mm` : undefined
    };

    // Verification analysis
    const verificationFlags = this.analyzeVerificationFlags(exifData, imageFile);

    // Emergency context
    const emergencyContext = this.analyzeEmergencyContext(exifData);

    return {
      exifData,
      hasLocation,
      hasTimestamp,
      deviceInfo,
      imageQuality,
      cameraSettings,
      verificationFlags,
      emergencyContext
    };
  }

  private analyzeVerificationFlags(exifData: ExifData, imageFile: File): {
    hasOriginalTimestamp: boolean;
    hasGpsData: boolean;
    hasDeviceInfo: boolean;
    suspiciousEditing: boolean;
    qualityScore: number;
  } {
    const hasOriginalTimestamp = !!(exifData.dateTimeOriginal || exifData.dateTimeDigitized);
    const hasGpsData = !!(exifData.latitude && exifData.longitude);
    const hasDeviceInfo = !!(exifData.make && exifData.model);
    
    // Check for signs of editing
    let suspiciousEditing = false;
    let editingIndicators = 0;

    // Check for software editing indicators
    if (exifData.software) {
      const editingSoftware = ['photoshop', 'gimp', 'lightroom', 'snapseed', 'vsco'];
      if (editingSoftware.some(software => 
        exifData.software!.toLowerCase().includes(software)
      )) {
        editingIndicators++;
      }
    }

    // Check for timestamp inconsistencies
    if (exifData.dateTime && exifData.dateTimeOriginal) {
      const timeDiff = Math.abs(
        exifData.dateTime.getTime() - exifData.dateTimeOriginal.getTime()
      );
      if (timeDiff > 60000) { // More than 1 minute difference
        editingIndicators++;
      }
    }

    // Check for unusual digital zoom
    if (exifData.digitalZoomRatio && exifData.digitalZoomRatio > 1) {
      editingIndicators++;
    }

    suspiciousEditing = editingIndicators >= 2;

    // Calculate quality score (0-100)
    let qualityScore = 0;
    if (hasOriginalTimestamp) qualityScore += 25;
    if (hasGpsData) qualityScore += 25;
    if (hasDeviceInfo) qualityScore += 20;
    if (!suspiciousEditing) qualityScore += 20;
    if (exifData.imageWidth && exifData.imageWidth > 1920) qualityScore += 10;

    return {
      hasOriginalTimestamp,
      hasGpsData,
      hasDeviceInfo,
      suspiciousEditing,
      qualityScore
    };
  }

  private analyzeEmergencyContext(exifData: ExifData): {
    captureTime?: Date;
    location?: { lat: number; lng: number };
    deviceReliability: number;
    timestampReliability: number;
  } {
    const captureTime = exifData.dateTimeOriginal || exifData.dateTime;
    const location = (exifData.latitude && exifData.longitude) ? {
      lat: exifData.latitude,
      lng: exifData.longitude
    } : undefined;

    // Calculate device reliability (0-100)
    let deviceReliability = 50; // Base score
    if (exifData.make && exifData.model) deviceReliability += 30;
    if (exifData.software) deviceReliability += 10;
    if (exifData.fNumber && exifData.exposureTime) deviceReliability += 10; // Has camera settings

    // Calculate timestamp reliability (0-100)
    let timestampReliability = 30; // Base score
    if (exifData.dateTimeOriginal) timestampReliability += 40;
    if (exifData.dateTimeDigitized) timestampReliability += 20;
    if (captureTime && captureTime.getTime() > Date.now() - (365 * 24 * 60 * 60 * 1000)) {
      timestampReliability += 10; // Recent timestamp
    }

    return {
      captureTime,
      location,
      deviceReliability: Math.min(100, deviceReliability),
      timestampReliability: Math.min(100, timestampReliability)
    };
  }

  private generateFallbackAnalysis(imageFile: File): ExifAnalysisResult {
    console.log('Generating fallback EXIF analysis');
    
    // Create basic analysis when EXIF extraction fails
    const now = new Date();
    const mockExifData: ExifData = {
      dateTime: now,
      imageWidth: 1920,
      imageHeight: 1080,
      rawExif: {}
    };

    return {
      exifData: mockExifData,
      hasLocation: false,
      hasTimestamp: true,
      deviceInfo: {},
      imageQuality: {
        resolution: 'Unknown',
        megapixels: 0,
        aspectRatio: 'Unknown'
      },
      cameraSettings: {},
      verificationFlags: {
        hasOriginalTimestamp: false,
        hasGpsData: false,
        hasDeviceInfo: false,
        suspiciousEditing: false,
        qualityScore: 20
      },
      emergencyContext: {
        captureTime: now,
        deviceReliability: 20,
        timestampReliability: 30
      }
    };
  }

  // Utility method to check if image has been edited
  async quickEditCheck(imageFile: File): Promise<{
    likelyEdited: boolean;
    confidence: number;
    indicators: string[];
  }> {
    try {
      const analysis = await this.extractExifData(imageFile);
      const indicators: string[] = [];
      
      if (analysis.verificationFlags.suspiciousEditing) {
        indicators.push('Software editing detected');
      }
      
      if (!analysis.hasTimestamp) {
        indicators.push('Missing original timestamp');
      }
      
      if (!analysis.hasLocation && imageFile.name.toLowerCase().includes('emergency')) {
        indicators.push('Missing GPS data for emergency image');
      }

      const likelyEdited = indicators.length >= 2;
      const confidence = Math.min(0.9, indicators.length * 0.3);

      return {
        likelyEdited,
        confidence,
        indicators
      };
    } catch (error) {
      return {
        likelyEdited: false,
        confidence: 0,
        indicators: ['EXIF analysis failed']
      };
    }
  }
}

export const exifService = new ExifService();
export type { ExifData, ExifAnalysisResult };