import axios from 'axios';
import { API_CONFIG } from '../../config/api.config';
import { 
  ExternalBrand, 
  ExternalCigar, 
  BrandResponse, 
  CigarResponse 
} from '../../types/cigar.types';

export class CigarApiService {
  private api;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.baseURL,
      headers: API_CONFIG.headers
    });
  }

  async fetchAllBrands(): Promise<ExternalBrand[]> {
    try {
      let page = 1;
      let allBrands: ExternalBrand[] = [];
      
      while (true) {
        const response = await this.api.get<BrandResponse>(`/brands?page=${page}`);
        const { brands, count } = response.data;
        
        if (!brands || brands.length === 0) break;
        
        allBrands = [...allBrands, ...brands];
        
        if (allBrands.length >= count) break;
        
        page++;
      }
      
      return allBrands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  async fetchCigarsForBrand(brandId: number): Promise<ExternalCigar[]> {
    try {
      let page = 1;
      let allCigars: ExternalCigar[] = [];
      
      while (true) {
        const response = await this.api.get<CigarResponse>(`/cigars?page=${page}&brandId=${brandId}`);
        const { cigars, count } = response.data;
        
        if (!cigars || cigars.length === 0) break;
        
        allCigars = [...allCigars, ...cigars];
        
        if (allCigars.length >= count) break;
        
        page++;
      }
      
      return allCigars;
    } catch (error) {
      console.error(`Error fetching cigars for brand ${brandId}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get<BrandResponse>('/brands?page=1');
      return Array.isArray(response.data.brands);
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

export const cigarApiService = new CigarApiService();