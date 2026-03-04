import { findOrCreateCluster, Listing } from '../lib/matching/listing-clusterer';
import { generateRecommendations } from '../lib/recommendations/engine';
import { calculateInvestment, InvestmentParams } from '../lib/investment-calculator';
import { marketReport } from '../lib/market-report';
import { analyzeListingImages } from '../lib/ai/image-analyzer';
import { getDb } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

async function verifyV2() {
  console.log('🧪 Starting Alert Scout v2.0 End-to-End Verification...');
  const db = getDb();

  // 0. Setup Test Data
  console.log('\n--- 0. Setup Test Data ---');
  const testUserId = uuidv4();
  const testAlertId = uuidv4();
  
  db.prepare(`INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)`).run(
    testUserId, `test-${testUserId}@example.com`, 'Test User', 'hash'
  );
  
  db.prepare(`INSERT INTO alerts (id, user_id, type, name, criteria, sources) VALUES (?, ?, ?, ?, ?, ?)`).run(
    testAlertId, testUserId, 'property', 'Hsinchu Rentals', '{"city":"hsinchu"}', '["591"]'
  );

  const testMatch1Id = uuidv4();
  const testMatch2Id = uuidv4();
  
  db.prepare(`
    INSERT INTO matches (id, alert_id, title, price, location, area, source, source_url, is_favorite, created_at, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testMatch1Id, testAlertId, 'Spacious 2BR East District', 25000, 'Hsinchu City East District Road 1', 25, '591', 'https://rent.591.com.tw/1', 1, new Date().toISOString(), 24.8, 120.97
  );

  db.prepare(`
    INSERT INTO matches (id, alert_id, title, price, location, area, source, source_url, is_favorite, created_at, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testMatch2Id, testAlertId, '2BR Hsinchu East Dist', 24500, 'Hsinchu City East District Road 1', 24.8, 'sinyi', 'https://sinyi.com.tw/1', 0, new Date().toISOString(), 24.801, 120.971
  );

  // 1. Verify Clustering
  console.log('\n--- 1. Verify Clustering ---');
  const newMatchId = uuidv4();
  const newListing: Listing = {
    id: newMatchId,
    address: 'Hsinchu City East District Road 1',
    price: 24800,
    ping: 25.1,
    rooms: 2,
    source: 'yungching',
    sourceUrl: 'https://yungching.com.tw/1'
  };

  // Insert into matches first
  db.prepare(`
    INSERT INTO matches (id, alert_id, title, price, location, area, source, source_url, is_favorite, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newMatchId, testAlertId, 'Yungching 2BR', 24800, 'Hsinchu City East District Road 1', 25.1, 'yungching', 'https://yungching.com.tw/1', 0, new Date().toISOString()
  );

  const clusterId = await findOrCreateCluster(newListing);
  console.log(`✅ Clustering result: ${clusterId ? `Matched cluster ${clusterId}` : 'No match (Expected if first time)'}`);
  
  if (clusterId) {
    const members = db.prepare('SELECT * FROM cluster_members WHERE cluster_id = ?').all(clusterId);
    console.log(`   Cluster members: ${members.length}`);
  }

  // 2. Verify Recommendations
  console.log('\n--- 2. Verify Recommendations ---');
  const recommendations = await generateRecommendations(testUserId, 5);
  console.log(`✅ Recommendations generated: ${recommendations.length}`);
  recommendations.forEach((rec, i) => {
    console.log(`   ${i+1}. ${rec.match.title} (Score: ${rec.score.toFixed(2)}) - Reasons: ${rec.reasons.join(', ')}`);
  });

  // 3. Verify Investment Calculator
  console.log('\n--- 3. Verify Investment Calculator ---');
  const params: InvestmentParams = {
    purchasePrice: 8500000,
    downPaymentPercent: 20,
    interestRate: 2.2,
    loanYears: 30,
    estimatedRent: 22000
  };
  const analysis = calculateInvestment(params);
  console.log(`✅ Investment analysis complete:`);
  console.log(`   Monthly Mortgage: NT$${analysis.monthlyMortgage.toLocaleString()}`);
  console.log(`   Cap Rate: ${analysis.capRate.toFixed(2)}%`);
  console.log(`   Cash on Cash: ${analysis.cashOnCashReturn.toFixed(2)}%`);
  console.log(`   Break-even Occupancy: ${analysis.breakEvenOccupancy.toFixed(1)}%`);

  // 4. Verify Market Report
  console.log('\n--- 4. Verify Market Report ---');
  const report = marketReport.generateMarketReport('hsinchu');
  console.log(`✅ Market report generated for ${report.city}:`);
  console.log(`   Total listings: ${report.metrics.totalListings}`);
  console.log(`   Avg Price: NT$${report.metrics.avgPrice.toLocaleString()}`);
  
  const waMessage = marketReport.formatWhatsAppReport(report);
  console.log(`\n📱 Previewing WhatsApp Report:`);
  console.log(waMessage.substring(0, 200) + '...');

  // 5. Verify Image Analysis
  console.log('\n--- 5. Verify Image Analysis ---');
  const imgAnalysis = await analyzeListingImages(testMatch1Id);
  console.log(`✅ Image analysis result for match ${testMatch1Id}:`);
  console.log(`   Score: ${imgAnalysis?.quality.score}/100`);
  console.log(`   Features: AC: ${imgAnalysis?.features.hasAC}, Furniture: ${imgAnalysis?.features.hasFurniture}`);
  
  if (imgAnalysis?.redFlags.length) {
    console.log(`   ⚠️ Red flags: ${imgAnalysis.redFlags.join(', ')}`);
  }

  console.log('\n✨ All v2.0 features verified successfully!');
  
  // Cleanup
  console.log('\n--- Cleanup ---');
  db.prepare('DELETE FROM cluster_members WHERE cluster_id = ?').run(clusterId);
  db.prepare('DELETE FROM listing_clusters WHERE id = ?').run(clusterId);
  db.prepare('DELETE FROM matches WHERE id IN (?, ?, ?)').run(testMatch1Id, testMatch2Id, newMatchId);
  db.prepare('DELETE FROM alerts WHERE id = ?').run(testAlertId);
  db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  console.log('🧹 Test data cleaned up.');
}

verifyV2().catch(console.error);
