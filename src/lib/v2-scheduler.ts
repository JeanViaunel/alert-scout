import cron from 'node-cron';
import { checkPriceChanges } from './price-tracker';
import { marketReport } from './market-report';
import { analyzeListingImages } from './ai/image-analyzer';
import { getDb } from './db';

/**
 * Alert Scout v2.0 Scheduler
 * Automates price tracking, market reports, and image analysis.
 */
export function scheduleV2Tasks() {
  console.log('📅 Scheduling Alert Scout v2.0 tasks...');

  // 1. Daily Price Check (6:00 AM)
  const priceCheckJob = cron.schedule('0 6 * * *', async () => {
    console.log('💰 [Cron] Running daily price check...');
    try {
      await checkPriceChanges();
      console.log('✅ [Cron] Price check complete');
    } catch (error) {
      console.error('❌ [Cron] Price check failed:', error);
    }
  });

  // 2. Weekly Market Reports (Monday 9:00 AM)
  const marketReportJob = cron.schedule('0 9 * * 1', async () => {
    console.log('📊 [Cron] Generating weekly market reports...');
    try {
      await marketReport.scheduleWeeklyReports();
      console.log('✅ [Cron] Weekly reports sent');
    } catch (error) {
      console.error('❌ [Cron] Weekly reports failed:', error);
    }
  });

  // 3. Daily Image Analysis (2:00 AM)
  // Process un-analyzed images in batches
  const imageAnalysisJob = cron.schedule('0 2 * * *', async () => {
    console.log('🖼️ [Cron] Running daily image analysis...');
    try {
      const db = getDb();
      const matches = db.prepare(`
        SELECT id FROM matches 
        WHERE id NOT IN (SELECT match_id FROM image_analysis)
        ORDER BY created_at DESC
        LIMIT 50
      `).all() as Array<{ id: string }>;
      
      console.log(`🖼️ [Cron] Analyzing ${matches.length} new images...`);
      for (const match of matches) {
        await analyzeListingImages(match.id);
      }
      console.log('✅ [Cron] Image analysis complete');
    } catch (error) {
      console.error('❌ [Cron] Image analysis failed:', error);
    }
  });

  console.log('✅ v2.0 Tasks Scheduled:');
  console.log('   💰 6:00 AM Daily - Price Drops');
  console.log('   📊 9:00 AM Mon   - Market Reports');
  console.log('   🖼️ 2:00 AM Daily - Image Analysis');

  return () => {
    priceCheckJob.stop();
    marketReportJob.stop();
    imageAnalysisJob.stop();
    console.log('🛑 v2.0 Scheduler stopped');
  };
}
