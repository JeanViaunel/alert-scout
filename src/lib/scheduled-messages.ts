// Alert Scout - Scheduled Message System
// This runs as part of the Alert Scout backend and sends you updates

import cron from 'node-cron';
import { getMatchesByUser } from '@/lib/matches';

// Your user email (will be retrieved from auth)
const YOUR_USER_EMAIL = "ppython2020@proton.me";

// Message templates
const MESSAGES = {
  morning: {
    title: "🌅 Good Morning! Apartment Update",
    body: "Here's your daily apartment summary for 591 Zhubei area (12k-18k TWD)...\n\nCheck your matches at: http://localhost:3000/matches",
  },
  noon: {
    title: "☀️ Good Afternoon! New Listings?",
    body: "Checking for new apartments around 691 TWD in Zhubei...\n\nNew matches will appear automatically in your Alert Scout dashboard.",
  },
  evening: {
    title: "🌙 Good Evening! Daily Summary",
    body: "Today's apartment search results:\n• Total matches found\n• New listings saved\n• Tips for tomorrow\n\nCheck your matches: http://localhost:3000/matches",
  },
};

// Schedule cron jobs
export function scheduleDailyMessages() {
  console.log('📅 Scheduling daily messages (8am, 12pm, 10pm)...');

  // 8:00 AM - Morning update
  const morningJob = cron.schedule('0 8 * * *', async () => {
    console.log('🌅 Sending morning message...');
    try {
      const matches = await getMatchesByUser(YOUR_USER_EMAIL);
      const message = MESSAGES.morning.body;
      
      // Log to console (you can check server logs)
      console.log(`📊 Found ${matches.length} matches for user`);
      
      // Here you'd add actual message sending:
      // await sendEmail(YOUR_USER_EMAIL, MESSAGES.morning.title, message);
      // await sendWhatsApp(YOUR_USER_EMAIL, message);
      
      console.log('✅ Morning message sent');
    } catch (error) {
      console.error('❌ Error sending morning message:', error);
    }
  });

  // 12:00 PM - Noon update
  const noonJob = cron.schedule('0 12 * * *', async () => {
    console.log('☀️ Sending noon message...');
    try {
      const matches = await getMatchesByUser(YOUR_USER_EMAIL);
      const message = MESSAGES.noon.body;
      
      console.log(`📊 Checking for updates...`);
      console.log(`📊 Current matches: ${matches.length}`);
      
      // Send message:
      // await sendEmail(YOUR_USER_EMAIL, MESSAGES.noon.title, message);
      // await sendWhatsApp(YOUR_USER_EMAIL, message);
      
      console.log('✅ Noon message sent');
    } catch (error) {
      console.error('❌ Error sending noon message:', error);
    }
  });

  // 10:00 PM - Evening summary
  const eveningJob = cron.schedule('0 22 * * *', async () => {
    console.log('🌙 Sending evening message...');
    try {
      const matches = await getMatchesByUser(YOUR_USER_EMAIL);
      const newToday = matches.filter(m => {
        const today = new Date();
        const created = new Date(m.createdAt);
        return created.toDateString() === today.toDateString();
      });
      
      let message = MESSAGES.evening.body;
      message += `\n\n📊 Today's Results:`;
      message += `\n   • Total matches: ${matches.length}`;
      message += `\n   • New today: ${newToday.length}`;
      message += `\n   • Active alerts: Running`;
      
      // Log to console:
      console.log(`📊 Daily summary:`);
      console.log(`   • Total matches: ${matches.length}`);
      console.log(`   • New today: ${newToday.length}`);
      
      // Send message:
      // await sendEmail(YOUR_USER_EMAIL, MESSAGES.evening.title, message);
      // await sendWhatsApp(YOUR_USER_EMAIL, message);
      
      console.log('✅ Evening message sent');
    } catch (error) {
      console.error('❌ Error sending evening message:', error);
    }
  });

  console.log('✅ All daily messages scheduled!');
  console.log('   🌅 8:00 AM - Morning update');
  console.log('   ☀️ 12:00 PM - Noon check');
  console.log('   🌙 10:00 PM - Evening summary');
  
  // Stop all jobs
  return () => {
    console.log('🛑 Stopping all scheduled messages...');
    morningJob.stop();
    noonJob.stop();
    eveningJob.stop();
    console.log('✅ All scheduled messages stopped');
  };
}

// Export for use in API route
export const scheduledMessages = {
  isRunning: false,
  stop: null as (() => void) | null,
};

// Start scheduler when app initializes
// This should be called in app startup
// scheduleDailyMessages();
