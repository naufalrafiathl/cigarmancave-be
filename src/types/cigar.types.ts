export interface ExternalBrand {
    brandId: number;
    name: string;
  }
  
  export interface ExternalCigar {
    cigarId: number;
    brandId: number;
    name: string;
    length: number;
    ringGauge: number;
    country: string;
    filler: string;
    wrapper: string;
    color: string;
    strength: string;
  }
  
  export interface BrandResponse {
    brands: ExternalBrand[];
    page: number;
    count: number;
  }
  
  export interface CigarResponse {
    cigars: ExternalCigar[];
    page: number;
    count: number;
  }