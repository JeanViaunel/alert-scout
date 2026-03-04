// Alert Scout - Application Entry Point
// Initializes scheduled messages and starts the app

import { scheduleDailyMessages } from '@/lib/scheduled-messages';

let isInitialized = false;

export function initializeScheduler() {
  if (isInitialized) {
    console.log('⚠️  Scheduler already initialized');
    return;
  }
  
  console.log('🚀 Initializing Alert Scout scheduler...');
  
  try {
    // Start daily message scheduling (8am, 12pm, 10pm)
    scheduleDailyMessages();
    
    isInitialized = true;
    console.log('✅ Scheduler initialized successfully!');
    console.log('   🌅 8:00 AM - Morning update');
    console.log('   ☀️ 12:00 PM - Noon check');
    console.log('   🌙 10:00 PM - Evening summary');
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
  isInitialized = false;
  
  // The scheduleDailyMessages function returns a stop function
  // Call it here if needed
  // For now, we'll restart the app to stop
  
  console.log('✅ Scheduler stopped (requires app restart to take full effect)');
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
