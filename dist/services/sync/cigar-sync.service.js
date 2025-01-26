"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cigarSyncService = exports.CigarSyncService = void 0;
const client_1 = require("@prisma/client");
const cigar_api_service_1 = require("../external/cigar-api.service");
const batch_utils_1 = require("../../utils/batch.utils");
class CigarSyncService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async saveBrands(brands) {
        try {
            await this.prisma.$transaction(brands.map(brand => this.prisma.brand.upsert({
                where: { id: brand.brandId },
                update: { name: brand.name },
                create: {
                    id: brand.brandId,
                    name: brand.name
                }
            })));
        }
        catch (error) {
            console.error('Error saving brands:', error);
            throw error;
        }
    }
    async saveCigars(cigars) {
        try {
            await this.prisma.$transaction(cigars.map(cigar => this.prisma.cigar.upsert({
                where: { id: cigar.cigarId },
                update: {
                    name: cigar.name,
                    length: cigar.length,
                    ringGauge: cigar.ringGauge,
                    country: cigar.country,
                    filler: cigar.filler,
                    wrapper: cigar.wrapper,
                    color: cigar.color,
                    strength: cigar.strength,
                    brandId: cigar.brandId
                },
                create: {
                    id: cigar.cigarId,
                    name: cigar.name,
                    length: cigar.length,
                    ringGauge: cigar.ringGauge,
                    country: cigar.country,
                    filler: cigar.filler,
                    wrapper: cigar.wrapper,
                    color: cigar.color,
                    strength: cigar.strength,
                    brandId: cigar.brandId
                }
            })));
        }
        catch (error) {
            console.error('Error saving cigars:', error);
            throw error;
        }
    }
    async syncAllData() {
        try {
            console.log('Starting data sync...');
            const isConnected = await cigar_api_service_1.cigarApiService.testConnection();
            if (!isConnected) {
                throw new Error('Could not connect to the cigar API');
            }
            console.log('Fetching brands...');
            const brands = await cigar_api_service_1.cigarApiService.fetchAllBrands();
            console.log(`Successfully fetched ${brands.length} brands`);
            console.log('Saving brands to database...');
            await this.saveBrands(brands);
            console.log('Successfully saved all brands');
            const brandChunks = (0, batch_utils_1.chunkArray)(brands, 5);
            let processedBrands = 0;
            let totalCigars = 0;
            for (const brandChunk of brandChunks) {
                console.log(`Processing brands ${processedBrands + 1} to ${processedBrands + brandChunk.length} of ${brands.length}`);
                const cigarPromises = brandChunk.map(async (brand) => {
                    console.log(`Fetching cigars for brand: ${brand.name} (ID: ${brand.brandId})`);
                    const cigars = await cigar_api_service_1.cigarApiService.fetchCigarsForBrand(brand.brandId);
                    console.log(`Found ${cigars.length} cigars for brand ${brand.name}`);
                    return cigars;
                });
                const cigarResults = await Promise.all(cigarPromises);
                const allCigars = cigarResults.flat();
                console.log(`Saving ${allCigars.length} cigars...`);
                const cigarChunks = (0, batch_utils_1.chunkArray)(allCigars, 100);
                for (const cigarChunk of cigarChunks) {
                    await this.saveCigars(cigarChunk);
                }
                processedBrands += brandChunk.length;
                totalCigars += allCigars.length;
                console.log(`Progress: ${processedBrands}/${brands.length} brands processed, ${totalCigars} total cigars saved`);
            }
            console.log('Data sync completed successfully!');
            console.log(`Final count: ${brands.length} brands and ${totalCigars} cigars`);
            return {
                brandsProcessed: brands.length,
                cigarsProcessed: totalCigars
            };
        }
        catch (error) {
            console.error('Error during data sync:', error);
            throw error;
        }
    }
    async syncSingleBrand(brandId) {
        try {
            console.log(`Starting sync for brand ID: ${brandId}`);
            const brands = await cigar_api_service_1.cigarApiService.fetchAllBrands();
            const brand = brands.find(b => b.brandId === brandId);
            if (!brand) {
                throw new Error(`Brand with ID ${brandId} not found`);
            }
            await this.saveBrands([brand]);
            console.log(`Saved brand: ${brand.name}`);
            const cigars = await cigar_api_service_1.cigarApiService.fetchCigarsForBrand(brandId);
            console.log(`Found ${cigars.length} cigars for brand ${brand.name}`);
            const cigarChunks = (0, batch_utils_1.chunkArray)(cigars, 100);
            for (const chunk of cigarChunks) {
                await this.saveCigars(chunk);
            }
            console.log(`Sync completed for brand: ${brand.name}`);
            return {
                brandProcessed: brand.name,
                cigarsProcessed: cigars.length
            };
        }
        catch (error) {
            console.error(`Error syncing brand ${brandId}:`, error);
            throw error;
        }
    }
    async getSyncStatus() {
        try {
            const brandCount = await this.prisma.brand.count();
            const cigarCount = await this.prisma.cigar.count();
            return {
                brands: brandCount,
                cigars: cigarCount,
                lastChecked: new Date()
            };
        }
        catch (error) {
            console.error('Error getting sync status:', error);
            throw error;
        }
    }
    async cleanup() {
        try {
            await this.prisma.$disconnect();
        }
        catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    }
}
exports.CigarSyncService = CigarSyncService;
exports.cigarSyncService = new CigarSyncService();
//# sourceMappingURL=cigar-sync.service.js.map