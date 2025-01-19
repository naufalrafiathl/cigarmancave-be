import { cigarSyncService } from '../services/sync/cigar-sync.service';

async function main() {
  try {
    const result = await cigarSyncService.syncAllData();
    console.log('Sync completed successfully!');
    console.log(`Processed ${result.brandsProcessed} brands and ${result.cigarsProcessed} cigars`);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}