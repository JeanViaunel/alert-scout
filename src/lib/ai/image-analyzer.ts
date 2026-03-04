import { getDb } from "../db";

export interface ImageAnalysis {
  matchId: string;
  imageUrl: string;
  features: {
    hasFurniture: boolean;
    hasAC: boolean;
    hasWasher: boolean;
    hasKitchen: boolean;
    hasBalcony: boolean;
    roomType: string;
  };
  quality: {
    score: number;
    isBlurry: boolean;
    isDark: boolean;
  };
  redFlags: string[];
}

/**
 * Analyzes listing images using AI.
 */
export async function analyzeListingImages(matchId: string): Promise<ImageAnalysis | null> {
  const db = getDb();
  
  // 1. Check if already analyzed
  const existing = db.prepare('SELECT analysis_json FROM image_analysis WHERE match_id = ?').get(matchId) as any;
  if (existing) {
    return JSON.parse(existing.analysis_json);
  }

  // 2. Get listing info (especially imageUrl)
  const match = db.prepare('SELECT image_url, title FROM matches WHERE id = ?').get(matchId) as any;
  if (!match?.image_url) return null;

  console.log(`Analyzing image for match ${matchId}: ${match.image_url}`);

  // 3. AI Vision call (Simulated)
  // In real life, we'd call Anthropic/OpenAI here
  const analysis: ImageAnalysis = {
    matchId,
    imageUrl: match.image_url,
    features: {
      hasFurniture: match.title.includes("附傢俱") || Math.random() > 0.5,
      hasAC: true,
      hasWasher: Math.random() > 0.3,
      hasKitchen: match.title.includes("廚房") || Math.random() > 0.4,
      hasBalcony: Math.random() > 0.5,
      roomType: 'bedroom'
    },
    quality: {
      score: Math.floor(Math.random() * 40) + 60, // 60-100
      isBlurry: false,
      isDark: false
    },
    redFlags: Math.random() > 0.9 ? ["Visible water damage on ceiling"] : []
  };

  // 4. Save to DB
  db.prepare(`
    INSERT INTO image_analysis (match_id, analysis_json)
    VALUES (?, ?)
  `).run(matchId, JSON.stringify(analysis));

  // 5. Update match flags for fast filtering
  db.prepare(`
    UPDATE matches 
    SET has_ac = ?, has_furniture = ?, image_quality_score = ?
    WHERE id = ?
  `).run(
    analysis.features.hasAC ? 1 : 0,
    analysis.features.hasFurniture ? 1 : 0,
    analysis.quality.score,
    matchId
  );

  return analysis;
}
