// Alert Scout - Application Entry Point
// Initializes scheduled messages and starts the app

import { scheduleDailyMessages } from '@/lib/scheduled-messages';
import { scheduleV2Tasks } from '@/lib/v2-scheduler';

let isInitialized = false;
let v2StopFn: (() => void) | null = null;

export function initializeScheduler() {
  if (isInitialized) {
    console.log('⚠️  Scheduler already initialized');
    return;
  }
  
  console.log('🚀 Initializing Alert Scout scheduler...');
  
  try {
    // Start daily message scheduling (8am, 12pm, 10pm)
    scheduleDailyMessages();

    // Start v2.0 tasks (Price checks, Market reports, Image analysis)
    v2StopFn = scheduleV2Tasks();
    
    isInitialized = true;
    console.log('✅ Scheduler initialized successfully!');
    console.log('   🌅 8:00 AM - Morning update');
    console.log('   ☀️ 12:00 PM - Noon check');
    console.log('   🌙 10:00 PM - Evening summary');
    console.log('   💰 v2.0 - Active (Price/Market/AI)');
    console.log('   💡 You can stop by calling stopScheduler()');
    
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
    throw error;
  }
}

export function stopScheduler() {
  if (!isInitialized) {
    console.log('⚠️  Scheduler not running');
    return;
  }
  
  console.log('🛑 Stopping Alert Scout scheduler...');
  
  if (v2StopFn) {
    v2StopFn();
    v2StopFn = null;
  }
  
  isInitialized = false;
  console.log('✅ Scheduler stopped');
}

export function getSchedulerStatus() {
  return {
    initialized: isInitialized,
    schedules: {
      morning: '0 8 * * *',
      noon: '0 12 * * *',
      evening: '0 22 * * *',
    },
  };
}

// Auto-initialize on module load (optional)
// Uncomment to auto-start scheduler:
// initializeScheduler();
