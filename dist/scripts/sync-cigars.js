"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cigar_sync_service_1 = require("../services/sync/cigar-sync.service");
async function main() {
    try {
        const result = await cigar_sync_service_1.cigarSyncService.syncAllData();
        console.log('Sync completed successfully!');
        console.log(`Processed ${result.brandsProcessed} brands and ${result.cigarsProcessed} cigars`);
    }
    catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=sync-cigars.js.map