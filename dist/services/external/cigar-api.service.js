"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cigarApiService = exports.CigarApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const api_config_1 = require("../../config/api.config");
class CigarApiService {
    constructor() {
        this.api = axios_1.default.create({
            baseURL: api_config_1.API_CONFIG.baseURL,
            headers: api_config_1.API_CONFIG.headers
        });
    }
    async fetchAllBrands() {
        try {
            let page = 1;
            let allBrands = [];
            while (true) {
                const response = await this.api.get(`/brands?page=${page}`);
                const { brands, count } = response.data;
                if (!brands || brands.length === 0)
                    break;
                allBrands = [...allBrands, ...brands];
                if (allBrands.length >= count)
                    break;
                page++;
            }
            return allBrands;
        }
        catch (error) {
            console.error('Error fetching brands:', error);
            throw error;
        }
    }
    async fetchCigarsForBrand(brandId) {
        try {
            let page = 1;
            let allCigars = [];
            while (true) {
                const response = await this.api.get(`/cigars?page=${page}&brandId=${brandId}`);
                const { cigars, count } = response.data;
                if (!cigars || cigars.length === 0)
                    break;
                allCigars = [...allCigars, ...cigars];
                if (allCigars.length >= count)
                    break;
                page++;
            }
            return allCigars;
        }
        catch (error) {
            console.error(`Error fetching cigars for brand ${brandId}:`, error);
            throw error;
        }
    }
    async testConnection() {
        try {
            const response = await this.api.get('/brands?page=1');
            return Array.isArray(response.data.brands);
        }
        catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}
exports.CigarApiService = CigarApiService;
exports.cigarApiService = new CigarApiService();
//# sourceMappingURL=cigar-api.service.js.map