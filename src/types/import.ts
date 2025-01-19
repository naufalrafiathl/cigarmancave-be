export enum ImportFileType {
    IMAGE = 'IMAGE',
    PDF = 'PDF',
    SPREADSHEET = 'SPREADSHEET'
  }
  
  export enum ProcessingMethod {
    OCR = 'OCR',
    VISION = 'VISION',
    DIRECT_PARSE = 'DIRECT_PARSE'
  }
  
  export enum CigarStrength {
    MILD = 'MILD',
    MILD_MEDIUM = 'MILD_MEDIUM',
    MEDIUM = 'MEDIUM',
    MEDIUM_FULL = 'MEDIUM_FULL',
    FULL = 'FULL'
  }
  
  export interface CigarImportData {
    brand: string;
    name: string;
    quantity: number; 
    purchasePrice?: number | null;
    purchaseDate?: Date | null;
    purchaseLocation?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
    length?: number | null;
    ringGauge?: number | null;
    country?: string | null;
    wrapper?: string | null;
    binder?: string | null;
    filler?: string | null;
    color?: string | null;
    strength?: string | null;
    source?: string;
  }

  
  
  export interface QuotaInfo {
    images: {
      used: number;
      total: number;
      remaining: number;
    };
    documents: {
      used: number;
      total: number;
      remaining: number;
    };
  }
  
  export interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  export interface ProcessingResult {
    success: boolean;
    data?: CigarImportData[];
    error?: string;
    method: ProcessingMethod;
    confidence?: number;
    cost: number;
    duration: number;
  }
  
  export interface MatchResult {
    exactMatches: Array<{
      importData: CigarImportData;
      existingCigar: any;
    }>;
    possibilities: Array<{
      importData: CigarImportData;
      possibleMatches: any[];
      scores: Array<{
        similarity: number;
        matchDetails: string[];
      }>;
    }>;
    newEntries: CigarImportData[];
  }
  
  export class QuotaExceededError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'QuotaExceededError';
    }
  }
  
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  export class ProcessingError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ProcessingError';
    }
  }