# Alert Scout v2.0 - Feature Specifications

**Version:** 2.0  
**Date:** March 3, 2026  
**Author:** Helix (Senior Dev + Design)  
**Status:** Ready for Implementation

---

## 📋 Feature Summary

| # | Feature | Priority | Est. Time | Dependencies |
|---|---------|----------|-----------|--------------|
| 1 | Price Drop Alerts | P0 | 6-8h | Core scraping |
| 2 | Multi-Source Comparison | P0 | 12-16h | Feature 1 |
| 3 | Smart Recommendations | P1 | 8-10h | Feature 1,2 |
| 4 | Map View | P0 | 10-12h | Geocoding |
| 7 | Commute Time Filter | P1 | 8-10h | Feature 4, Google Maps API |
| 8 | Image Analysis | P2 | 6-8h | AI API |
| 17 | Market Reports (WhatsApp) | P1 | 6-8h | WhatsApp API |
| 18 | Investment Calculator | P2 | 4-6h | Feature 2 |

**Total Estimated Time:** 60-78 hours (~2 weeks full-time)

---

# Feature 1: Price Drop Alerts

## Overview
Track price changes on existing matches and notify users when prices decrease.

---

## Technical Specs

### Database Changes

```sql
-- Add to matches table
ALTER TABLE matches ADD COLUMN price_history JSON;
ALTER TABLE matches ADD COLUMN first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE matches ADD COLUMN last_price_check DATETIME;
ALTER TABLE matches ADD COLUMN is_price_dropped BOOLEAN DEFAULT FALSE;

-- New table for price change tracking
CREATE TABLE price_changes (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id),
  old_price INTEGER,
  new_price INTEGER,
  change_amount INTEGER,
  change_percent REAL,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_price_changes_match ON price_changes(match_id);
CREATE INDEX idx_matches_price_dropped ON matches(is_price_dropped);
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/:id/price-history` | Get price history for a match |
| GET | `/api/alerts/price-drops` | Get all price-drop matches for user |
| POST | `/api/alerts/:id/price-drop-config` | Configure price drop sensitivity |

### Scraper Changes

```typescript
// src/lib/scrapers/price-tracker.ts

interface PriceCheckResult {
  matchId: string;
  oldPrice: number;
  newPrice: number;
  hasChanged: boolean;
  changePercent: number;
}

async function checkPriceChanges(userId: string): Promise<PriceCheckResult[]> {
  // 1. Get all active matches for user (last 30 days)
  // 2. Re-scrape each listing URL
  // 3. Compare current price vs stored price
  // 4. Record changes in price_changes table
  // 5. Return results for notification
}

// Run daily via cron (not every 15min - prices don't change that fast)
```

### Notification Logic

```typescript
// src/lib/notifications/price-drop.ts

interface PriceDropNotification {
  userId: string;
  matchId: string;
  listingTitle: string;
  oldPrice: number;
  newPrice: number;
  savings: number;
  savingsPercent: number;
  listingUrl: string;
  imageUrl: string;
}

// Trigger conditions:
// - Price dropped by >= 5% (configurable)
// - User has not been notified for this match in last 24h
```

---

## UI/UX Design

### Price History Chart Component

```
┌─────────────────────────────────────┐
│  Price History                      │
│                                     │
│  NT$25,000 ┤    ●                   │
│            │   ╱ ╲                  │
│  NT$22,000 ┤  ●   ●────●            │
│            │ ╱         ╲            │
│  NT$20,000 ┤●           ●  ← Current│
│            └─────────────────────   │
│            Jan  Feb  Mar  Apr       │
│                                     │
│  💰 Price dropped NT$3,000 (12%)    │
│  📅 First seen: Jan 15, 2026        │
└─────────────────────────────────────┘
```

### Match Card Enhancement

```
┌────────────────────────────────┐
│ [Image]   2BR Apartment        │
│           Hsinchu East District│
│                                 │
│  NT$20,000  ← Was NT$23,000    │
│  🟢 -NT$3,000 (13% off!)       │
│                                 │
│  [View Details] [Favorite]     │
└────────────────────────────────┘
```

### Price Drop Alert Settings

```
Alert Settings → Price Drop Notifications

[✓] Notify me when prices drop

Minimum drop amount:
  [ 5 % ] or [ NT$ 1,000 ] (whichever is less)

Notification frequency:
  (●) Instant
  ( ) Daily digest
  ( ) Weekly summary
```

---

## Implementation Steps

1. **Database Migration** (1h)
   - Add columns to matches table
   - Create price_changes table
   - Add indexes

2. **Price Tracker Service** (2h)
   - Create `src/lib/scrapers/price-tracker.ts`
   - Implement re-scraping logic
   - Handle 404s (delisted properties)

3. **API Endpoints** (1h)
   - Price history endpoint
   - Price drop list endpoint

4. **UI Components** (2h)
   - Price history chart (recharts)
   - Enhanced match cards
   - Settings panel

5. **Cron Job** (1h)
   - Daily price check scheduler
   - Error handling & logging

6. **Notifications** (1h)
   - Email template for price drops
   - WhatsApp message format

---

# Feature 2: Multi-Source Comparison

## Overview
Scrape multiple property platforms and compare the same/similar listings across sources.

---

## Technical Specs

### Supported Sources (Phase 1)

| Source | Type | URL Pattern | Priority |
|--------|------|-------------|----------|
| 591 Rent | Rental | rent.591.com.tw | P0 |
| 信義房屋 | Rental/Sale | www.hsinchu.com.tw | P0 |
| 永慶房屋 | Rental/Sale | www.yungching.com.tw | P1 |
| 591 Buy | Sale | buy.591.com.tw | P1 |

### Database Changes

```sql
-- Add source tracking
ALTER TABLE matches ADD COLUMN source_id TEXT;
ALTER TABLE matches ADD COLUMN external_id TEXT;  -- Original listing ID

-- New table for cross-source matching
CREATE TABLE listing_clusters (
  id TEXT PRIMARY KEY,
  cluster_key TEXT,  -- Hash of address + similar features
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cluster_members (
  cluster_id TEXT REFERENCES listing_clusters(id),
  match_id TEXT REFERENCES matches(id),
  source TEXT,
  source_url TEXT,
  price INTEGER,
  ping REAL,
  floor TEXT,
  UNIQUE(cluster_id, match_id)
);

-- Confidence score for matching
CREATE TABLE cluster_confidence (
  cluster_id TEXT PRIMARY KEY,
  confidence_score REAL,  -- 0-1
  matching_factors JSON   -- What matched: address, price, size, etc.
);
```

### Matching Algorithm

```typescript
// src/lib/matching/listing-clusterer.ts

interface ListingSignature {
  normalizedAddress: string;
  priceRange: [number, number];  // ±10%
  pingRange: [number, number];   // ±5%
  roomCount: number;
  floor: string;
  buildingName?: string;
}

function calculateSimilarity(listing1: Listing, listing2: Listing): number {
  let score = 0;
  
  // Address match (fuzzy) - 40% weight
  if (fuzzyMatch(listing1.address, listing2.address)) score += 0.4;
  
  // Price within 10% - 25% weight
  if (priceWithinRange(listing1.price, listing2.price, 0.1)) score += 0.25;
  
  // Same ping (area) within 5% - 20% weight
  if (Math.abs(listing1.ping - listing2.ping) / listing1.ping < 0.05) score += 0.2;
  
  // Same room count - 10% weight
  if (listing1.rooms === listing2.rooms) score += 0.1;
  
  // Same floor - 5% weight
  if (listing1.floor === listing2.floor) score += 0.05;
  
  return score;
}

// Threshold: >= 0.7 = same listing
const CLUSTER_THRESHOLD = 0.7;
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/:id/comparisons` | Get same listing on other platforms |
| GET | `/api/compare/:clusterId` | View cluster comparison |
| GET | `/api/sources` | List available sources + status |

---

## UI/UX Design

### Comparison Card

```
┌─────────────────────────────────────────────────────┐
│  Same Listing Across Platforms                      │
│  📍 Hsinchu East District, Near Train Station       │
│                                                     │
│  ┌─────────────┬─────────────┬─────────────┐       │
│  │   591 Rent  │  信義房屋    │  永慶房屋    │       │
│  ├─────────────┼─────────────┼─────────────┤       │
│  │ NT$20,000   │ NT$21,000   │ NT$19,500   │       │
│  │             │             │             │       │
│  │ 🏆 Best Price           │             │       │
│  │             │ +NT$1,000   │ -NT$500     │       │
│  │             │             │             │       │
│  │ [Contact]   │ [Contact]   │ [Contact]   │       │
│  └─────────────┴─────────────┴─────────────┘       │
│                                                     │
│  💡 Save NT$1,500/mo with 永慶房屋                  │
└─────────────────────────────────────────────────────┘
```

### Source Status Dashboard

```
Data Sources Status

591 Rent      ● Online     Last checked: 2 min ago
信義房屋       ● Online     Last checked: 5 min ago
永慶房屋       ⚠ Limited    Last checked: 1 hour ago
591 Buy       ○ Paused     (Coming soon)
```

---

## Implementation Steps

1. **Source Adapters** (4h)
   - Create `src/lib/scrapers/hsinchu.ts` (信義)
   - Create `src/lib/scrapers/yungching.ts` (永慶)
   - Standardize output format

2. **Clustering Algorithm** (3h)
   - Implement similarity scoring
   - Address normalization (remove formatting differences)
   - Cluster creation & maintenance

3. **Database Schema** (1h)
   - Migration for cluster tables
   - Indexes for fast lookups

4. **API Layer** (2h)
   - Comparison endpoints
   - Cluster query logic

5. **UI Components** (3h)
   - Comparison card
   - Source status indicator
   - Best price highlight

6. **Cron Integration** (1h)
   - Multi-source scraping schedule
   - Rate limiting per source

---

# Feature 3: Smart Recommendations

## Overview
AI-powered suggestions for listings users might like based on behavior and preferences.

---

## Technical Specs

### Data Collection

```typescript
// Track user interactions
interface UserInteraction {
  userId: string;
  matchId: string;
  action: 'view' | 'favorite' | 'contact' | 'skip' | 'share';
  duration?: number;  // Time spent viewing (ms)
  timestamp: Date;
}

// Store in new table
CREATE TABLE user_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  match_id TEXT REFERENCES matches(id),
  action TEXT,
  duration_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Recommendation Engine

```typescript
// src/lib/recommendations/engine.ts

interface Recommendation {
  matchId: string;
  score: number;
  reason: string;  // "Similar to saved listings" / "Popular in your area"
}

function generateRecommendations(userId: string, limit = 10): Recommendation[] {
  // 1. Get user's favorited/viewed listings
  // 2. Extract features (price range, location, size, rooms)
  // 3. Find similar unmatched listings
  // 4. Score by similarity + recency + popularity
  // 5. Return top N
  
  const userPreferences = getUserPreferenceProfile(userId);
  const candidateMatches = getCandidateMatches(userPreferences);
  const scored = candidateMatches.map(m => ({
    ...m,
    score: calculateMatchScore(m, userPreferences)
  }));
  
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function calculateMatchScore(match: Match, prefs: UserPreferences): number {
  let score = 0;
  
  // Price alignment (30%)
  score += (1 - Math.abs(match.price - prefs.avgPrice) / prefs.avgPrice) * 0.3;
  
  // Location match (25%)
  if (match.district === prefs.preferredDistrict) score += 0.25;
  
  // Size match (20%)
  score += (1 - Math.abs(match.ping - prefs.avgPing) / prefs.avgPing) * 0.2;
  
  // Room match (15%)
  if (match.rooms === prefs.preferredRooms) score += 0.15;
  
  // Recency bonus (10%)
  const ageInDays = (Date.now() - match.createdAt) / 86400000;
  score += Math.max(0, (30 - ageInDays) / 30) * 0.1;
  
  return score;
}
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get personalized recommendations |
| POST | `/api/interactions` | Track user interaction |
| GET | `/api/recommendations/feedback` | Collect thumbs up/down |

---

## UI/UX Design

### Recommendations Section (Dashboard)

```
┌─────────────────────────────────────────────┐
│  ✨ Recommended For You                     │
│  Based on your saved listings               │
│                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │ Image │ │ Image │ │ Image │ │ Image │   │
│  │ NT$18K│ │ NT$22K│ │ NT$20K│ │ NT$25K│   │
│  │ 2BR   │ │ 3BR   │ │ 2BR   │ │ 3BR   │   │
│  │ 92%   │ │ 88%   │ │ 85%   │ │ 82%   │   │
│  │ Match │ │ Match │ │ Match │ │ Match │   │
│  └───────┘ └───────┘ └───────┘ └───────┘   │
│                                             │
│  [View All Recommendations]                 │
└─────────────────────────────────────────────┘
```

### Reason Tooltips

```
Why is this recommended?

✓ Similar price to your saved listings (NT$18K-22K)
✓ Same district (East Hsinchu)
✓ Has parking (you favorited 3 with parking)
✓ Listed within 24 hours
```

---

## Implementation Steps

1. **Interaction Tracking** (2h)
   - Create interactions table
   - Add tracking to frontend (view, favorite, skip)
   - API endpoint for logging

2. **Preference Profiling** (2h)
   - Calculate user preference averages
   - Store in cache for fast access

3. **Recommendation Engine** (3h)
   - Scoring algorithm
   - Candidate selection
   - Diversity filtering (not all same price)

4. **API + Caching** (1h)
   - Recommendations endpoint
   - Cache for 1 hour (regen on new interactions)

5. **UI Components** (2h)
   - Recommendation cards
   - Match score indicator
   - Feedback buttons

---

# Feature 4: Map View

## Overview
Interactive map showing all matching properties with clustering and filters.

---

## Technical Specs

### Geocoding Setup

```typescript
// src/lib/geocode.ts (existing - enhance)

interface GeocodedListing {
  matchId: string;
  latitude: number;
  longitude: number;
  address: string;
  geocodeAccuracy: 'exact' | 'street' | 'district' | 'city';
  geocodedAt: Date;
}

// Use existing geocode.ts + add caching
// Batch geocode on match creation
// Cache: address → lat/lng (Redis)
```

### Database Changes

```sql
-- Add geocoding columns
ALTER TABLE matches ADD COLUMN latitude REAL;
ALTER TABLE matches ADD COLUMN longitude REAL;
ALTER TABLE matches ADD COLUMN geocode_accuracy TEXT;

-- Spatial index for fast radius queries
CREATE INDEX idx_matches_location ON matches(latitude, longitude);
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/map` | Get all matches with lat/lng |
| GET | `/api/matches/map/bounds` | Get matches within map bounds |
| POST | `/api/matches/geocode-batch` | Trigger batch geocoding |

```typescript
// GET /api/matches/map?bounds=n,e,s,w&alertId=xxx
async function getMatchesInBounds(bounds: Bounds, alertId?: string) {
  const query = `
    SELECT id, title, price, latitude, longitude, image_url, is_favorite
    FROM matches
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      ${alertId ? 'AND alert_id = ?' : ''}
  `;
  // Return GeoJSON for easy map rendering
}
```

---

## UI/UX Design

### Map Page Layout

```
┌──────────────────────────────────────────────────────┐
│  Map View                              [List] [Map] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────┐                                          │
│  │Filters │    ┌─────────────────────────┐          │
│  │        │    │                         │          │
│  │Price   │    │     📍 📍               │          │
│  │[$-$$]  │    │   📍     📍📍📍         │          │
│  │        │    │        📍               │          │
│  │Rooms   │    │   📍📍      📍          │          │
│  │[1-4+]  │    │                         │          │
│  │        │    │         📍📍            │          │
│  │More ▾  │    │    Hsinchu              │          │
│  └────────┘    │                         │          │
│                └─────────────────────────┘          │
│                                                      │
│  Legend: 📍 Available  ⭐ Favorited  🏷️ Price Drop  │
└──────────────────────────────────────────────────────┘
```

### Map Marker Popup

```
┌─────────────────────────┐
│ [Image Thumbnail]       │
│ 2BR Apartment           │
│ NT$20,000/mo            │
│ East District           │
│                         │
│ 45 ping | Floor 5/10    │
│                         │
│ [View Details] [♥]      │
└─────────────────────────┘
```

### Cluster Expansion

```
When zoomed out:  ⑮ (shows count)
When zoomed in:   📍 📍 📍 (individual markers)
```

---

## Implementation Steps

1. **Geocoding Pipeline** (2h)
   - Enhance existing geocode.ts
   - Batch geocode existing matches
   - Add lat/lng to new matches automatically

2. **Map Component** (4h)
   - Integrate Leaflet (already installed)
   - Create marker components
   - Implement clustering (leaflet.markercluster)

3. **API Endpoints** (2h)
   - Bounds-based query
   - GeoJSON output format

4. **Filters Panel** (2h)
   - Price range slider
   - Room count toggle
   - Real-time map filtering

5. **Mobile Optimization** (1h)
   - Full-screen map on mobile
   - Bottom sheet for filters

6. **Performance** (1h)
   - Marker clustering for 1000+ points
   - Virtual scrolling for list view

---

# Feature 7: Commute Time Filter

## Overview
Filter properties by commute time to work/school using transit APIs.

---

## Technical Specs

### Google Maps Integration

```typescript
// src/lib/commute.ts

interface CommuteDestination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  arrivalTime?: string;  // "09:00" for rush hour calculation
}

interface CommuteResult {
  origin: string;
  destination: string;
  durationMinutes: number;
  distanceKm: number;
  mode: 'driving' | 'transit' | 'walking' | 'bicycling';
  routes: RouteOption[];
}

async function calculateCommute(
  originLat: number,
  originLng: number,
  destination: CommuteDestination,
  mode: 'transit' | 'driving' = 'transit'
): Promise<CommuteResult> {
  // Use Google Maps Distance Matrix API
  // Or Naver Map API (better for Taiwan)
}

// Cache results for 24 hours (commute times don't change much)
```

### Database Changes

```sql
-- User's saved destinations
CREATE TABLE commute_destinations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,  -- "Office", "School"
  address TEXT,
  latitude REAL,
  longitude REAL,
  default_mode TEXT DEFAULT 'transit',
  arrival_time TEXT  -- "09:00"
);

-- Pre-calculated commute times for matches
CREATE TABLE match_commute (
  match_id TEXT REFERENCES matches(id),
  destination_id TEXT REFERENCES commute_destinations(id),
  duration_minutes INTEGER,
  mode TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (match_id, destination_id)
);
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commute/destinations` | Get user's saved destinations |
| POST | `/api/commute/destinations` | Add new destination |
| GET | `/api/matches?commute_to=X&max_minutes=30` | Filter by commute |

---

## UI/UX Design

### Commute Filter Panel

```
┌─────────────────────────────────────┐
│  Commute Filter                     │
│                                     │
│  Destination:                       │
│  [Office (Hsinchu Science Park) ▼] │
│                                     │
│  Max commute time:                  │
│  [━━━━━●━━━━━] 30 min              │
│                                     │
│  Mode:                              │
│  (●) Transit  ( ) Driving          │
│  ( ) Walking  ( ) Bicycling        │
│                                     │
│  Departure time:                    │
│  [08:30] on [Weekdays ▼]           │
│                                     │
│  [Apply Filter]                     │
└─────────────────────────────────────┘
```

### Map with Commute Isochrones

```
┌──────────────────────────────────────┐
│                                      │
│      ╭──────────╮                    │
│    ╱   30 min    ╲                   │
│   │   ╭──────╮   │                  │
│   │   │ 15min│   │  Office 📍       │
│   │   ╰──────╯   │                  │
│    ╲            ╱                   │
│      ╰──────────╯                   │
│                                      │
│  📍 Properties within 30 min         │
└──────────────────────────────────────┘
```

### Match Card with Commute Badge

```
┌─────────────────────────┐
│ [Image]  2BR Apartment  │
│          NT$20,000      │
│                         │
│  🚌 22 min to Office    │
│  (8:30 AM, Transit)     │
│                         │
│  [View Details]         │
└─────────────────────────┘
```

---

## Implementation Steps

1. **API Setup** (2h)
   - Get Google Maps API key (or Naver Maps for Taiwan)
   - Create commute calculation service
   - Add rate limiting (API costs money)

2. **Destination Management** (2h)
   - CRUD for saved destinations
   - Geocode destination addresses
   - UI for adding/editing

3. **Commute Calculation** (2h)
   - Batch calculate for visible matches
   - Cache results
   - Handle API failures gracefully

4. **Map Integration** (2h)
   - Draw isochrone polygons
   - Filter markers by commute time
   - Real-time updates

5. **Search Filter** (1h)
   - Add commute params to search API
   - Backend filtering

6. **UI Components** (1h)
   - Commute filter panel
   - Badge on match cards
   - Destination selector

---

# Feature 8: Image Analysis

## Overview
AI-powered analysis of listing photos to extract features and flag issues.

---

## Technical Specs

### AI Integration (Phase 1: WhatsApp Report)

```typescript
// src/lib/ai/image-analyzer.ts

interface ImageAnalysis {
  matchId: string;
  imageUrl: string;
  features: {
    hasFurniture: boolean;
    hasAC: boolean;
    hasWasher: boolean;
    hasKitchen: boolean;
    hasBalcony: boolean;
    roomType: 'bedroom' | 'livingroom' | 'kitchen' | 'bathroom';
  };
  quality: {
    score: number;  // 0-100
    isBlurry: boolean;
    isDark: boolean;
    photoCount: number;
  };
  redFlags: string[];  // ["Water damage visible", "Very cramped"]
  analyzedAt: Date;
}

async function analyzeListingImages(matchId: string): Promise<ImageAnalysis> {
  // Get listing images
  // Send to AI vision API (Claude Vision / GPT-4V)
  // Parse structured response
  // Store in database
}

// Prompt for AI:
const ANALYSIS_PROMPT = `
Analyze this rental property photo and return JSON:
{
  "features": {
    "hasFurniture": boolean,
    "hasAC": boolean,
    "hasWasher": boolean,
    "hasKitchen": boolean,
    "hasBalcony": boolean
  },
  "quality": {
    "score": number (0-100),
    "isBlurry": boolean,
    "isDark": boolean
  },
  "redFlags": string[]
}
Be strict on red flags. Only flag clear issues.
`;
```

### Database Changes

```sql
-- Store analysis results
CREATE TABLE image_analysis (
  match_id TEXT PRIMARY KEY REFERENCES matches(id),
  analysis_json JSON,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add feature flags to matches for fast filtering
ALTER TABLE matches ADD COLUMN has_ac BOOLEAN;
ALTER TABLE matches ADD COLUMN has_furniture BOOLEAN;
ALTER TABLE matches ADD COLUMN image_quality_score INTEGER;
```

### WhatsApp Report Format

```
📊 Weekly Image Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This week's listings analyzed: 47

🏆 Top Quality Listings (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 2BR East District - NT$20,000
   Score: 94/100
   ✓ Clear photos (8 images)
   ✓ AC, Furniture, Kitchen visible
   ✓ No red flags
   🔗 https://591.com.tw/...

2. 3BR North District - NT$25,000
   Score: 91/100
   ✓ Bright, spacious photos
   ✓ Balcony visible
   ⚠ Minor: Some photos slightly dark
   🔗 https://591.com.tw/...

⚠️ Listings with Red Flags (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 1BR East District - NT$15,000
   Score: 42/100
   🚩 Water damage visible in bathroom
   🚩 Very cramped space
   🔗 https://591.com.tw/...

2. 2BR West District - NT$18,000
   Score: 38/100
   🚩 Blurry photos (possibly hiding issues)
   🚩 No kitchen visible
   🔗 https://591.com.tw/...

💡 Tips:
- High quality scores often indicate professional listings
- Red flags don't mean don't rent - just inspect carefully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Want to analyze specific listings? Reply with the URL!
```

---

## Implementation Steps

1. **AI Integration** (2h)
   - Set up Claude Vision or GPT-4V API
   - Create analysis prompt template
   - Test with sample images

2. **Analysis Pipeline** (2h)
   - Batch process new listings
   - Store results in database
   - Add feature flags for filtering

3. **WhatsApp Report** (2h)
   - Weekly aggregation query
   - Format message template
   - Schedule via cron (every Monday 9 AM)

4. **UI Filters** (1h)
   - Filter by image quality score
   - Filter by features (AC, furniture)
   - Show red flags in match cards

5. **On-Demand Analysis** (1h)
   - API endpoint for URL analysis
   - WhatsApp command: "analyze <url>"

---

# Feature 17: Market Reports (WhatsApp)

## Overview
Weekly market insights delivered via WhatsApp.

---

## Technical Specs

### Report Generation

```typescript
// src/lib/reports/market-report.ts

interface MarketReport {
  period: {
    start: Date;
    end: Date;
  };
  city: string;
  metrics: {
    totalListings: number;
    newThisWeek: number;
    avgPrice: number;
    avgPriceChange: number;  // vs last week
    avgPing: number;
    avgPricePerPing: number;
    priceDistribution: {
      under15k: number;
      15k-20k: number;
      20k-25k: number;
      25k-30k: number;
      over30k: number;
    };
    topDistricts: DistrictStats[];
    hotKeywords: string[];
  };
}

async function generateMarketReport(
  city: string = 'hsinchu',
  period: 'week' | 'month' = 'week'
): Promise<MarketReport> {
  // Query matches from period
  // Calculate statistics
  // Compare to previous period
  // Find trending districts/keywords
}
```

### WhatsApp Message Format

```
🏠 Alert Scout Weekly Market Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Hsinchu | Mar 3-9, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Market Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Active Listings: 1,247
New This Week: +89 (↑12%)
Average Rent: NT$21,450/mo (↑NT$350)
Avg Price per Ping: NT$680 (↑NT$20)

📈 Price Trend (4 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Week 1: NT$20,800
Week 2: NT$21,100
Week 3: NT$21,250
Week 4: NT$21,450 ← Current

Trend: 📈 Rising (+3.1% in 4 weeks)

🏘️ Top Districts by Volume
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. East District    - 342 listings (NT$22,100 avg)
2. North District   - 289 listings (NT$19,800 avg)
3. West District    - 201 listings (NT$18,500 avg)
4. South District   - 156 listings (NT$20,200 avg)
5. Science Park     - 124 listings (NT$24,500 avg)

🔥 Hot Search Terms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#parking (↑45% this week)
#balcony (↑32%)
#furnished (↑28%)
#pet-friendly (↑15%)

💰 Best Deals This Week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 2BR East District - NT$18,000
   (Market avg: NT$22,100 | Save NT$4,100!)
   
2. 3BR North District - NT$20,000
   (Market avg: NT$25,000 | Save NT$5,000!)

📱 Quick Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Create alert: Reply "ALERT <district> <budget>"
• View listings: Reply "LISTINGS <district>"
• Pause reports: Reply "STOP REPORTS"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated by Alert Scout 🧬
```

### Database Queries

```sql
-- Weekly stats
SELECT 
  COUNT(*) as total_listings,
  AVG(price) as avg_price,
  AVG(price / ping) as avg_price_per_ping,
  COUNT(CASE WHEN created_at > ? THEN 1 END) as new_this_week
FROM matches
WHERE source = '591'
  AND city = 'hsinchu'
  AND created_at BETWEEN ? AND ?;

-- District breakdown
SELECT 
  district,
  COUNT(*) as listing_count,
  AVG(price) as avg_price
FROM matches
WHERE city = 'hsinchu'
GROUP BY district
ORDER BY listing_count DESC
LIMIT 5;

-- Trending keywords
SELECT keyword, COUNT(*) as usage_count
FROM alert_keywords
WHERE created_at > ?
GROUP BY keyword
ORDER BY usage_count DESC
LIMIT 10;
```

---

## Implementation Steps

1. **Report Generator** (3h)
   - Create aggregation queries
   - Calculate week-over-week changes
   - Format statistics

2. **WhatsApp Integration** (2h)
   - Set up WhatsApp Business API
   - Create message template
   - Add opt-in/opt-out handling

3. **Scheduler** (1h)
   - Weekly cron (Monday 9 AM)
   - User timezone handling
   - Retry on failure

4. **Personalization** (2h)
   - Filter by user's saved districts
   - Include their alert criteria matches
   - Add personalized recommendations

---

# Feature 18: Investment Calculator

## Overview
Help users evaluate rental properties as investment opportunities.

---

## Technical Specs

### Calculator Logic

```typescript
// src/lib/investment/calculator.ts

interface InvestmentAnalysis {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  estimatedRent: number;
  monthlyExpenses: {
    propertyTax: number;
    managementFee: number;
    maintenance: number;
    vacancy: number;  // 1 month / year amortized
  };
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;  // NOI / Purchase Price
  cashOnCashReturn: number;  // Annual Cash Flow / Down Payment
  breakEvenOccupancy: number;  // % occupancy needed
  fiveYearProjection: Projection[];
}

function calculateInvestment(params: InvestmentParams): InvestmentAnalysis {
  const { purchasePrice, downPaymentPercent, interestRate, loanYears, estimatedRent } = params;
  
  const downPayment = purchasePrice * downPaymentPercent;
  const loanAmount = purchasePrice - downPayment;
  
  // Monthly mortgage (P&I)
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanYears * 12;
  const monthlyMortgage = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  // Monthly expenses
  const propertyTax = purchasePrice * 0.012 / 12;  // ~1.2% annually in Taiwan
  const managementFee = estimatedRent * 0.05;  // 5% if using agent
  const maintenance = purchasePrice * 0.01 / 12;  // 1% annually
  const vacancy = estimatedRent / 12;  // 1 month vacancy per year
  
  const totalExpenses = monthlyMortgage + propertyTax + managementFee + maintenance + vacancy;
  const monthlyCashFlow = estimatedRent - totalExpenses;
  
  // Returns
  const noi = (estimatedRent * 12) - (propertyTax + managementFee + maintenance + vacancy) * 12;
  const capRate = noi / purchasePrice * 100;
  const cashOnCashReturn = (monthlyCashFlow * 12) / downPayment * 100;
  
  return {
    purchasePrice,
    downPayment,
    loanAmount,
    monthlyMortgage,
    estimatedRent,
    monthlyExpenses: { propertyTax, managementFee, maintenance, vacancy },
    monthlyCashFlow,
    annualCashFlow: monthlyCashFlow * 12,
    capRate,
    cashOnCashReturn,
    breakEvenOccupancy: totalExpenses / estimatedRent * 100,
    fiveYearProjection: generateProjection(...)
  };
}
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/investment/calculate` | Run investment analysis |
| GET | `/api/matches/:id/investment` | Get analysis for specific property |
| GET | `/api/investment/compare` | Compare multiple properties |

---

## UI/UX Design

### Investment Calculator Widget

```
┌─────────────────────────────────────────────┐
│  💰 Investment Analysis                     │
│  2BR Apartment - NT$8,500,000              │
├─────────────────────────────────────────────┤
│                                             │
│  Purchase Details:                          │
│  Price:        [NT$ 8,500,000]             │
│  Down Payment: [20 %]  = NT$1,700,000      │
│  Loan:         [30 yrs] @ [2.5%]           │
│                                             │
│  Income:                                    │
│  Est. Rent:    [NT$ 22,000/mo]             │
│                                             │
│  ─────────────────────────────────          │
│  Results:                                   │
│                                             │
│  Monthly Mortgage:  NT$ 33,586             │
│  Monthly Expenses:  NT$ 5,200              │
│  ─────────────────────────                  │
│  Monthly Cash Flow: ─NT$ 16,786 ❌         │
│                                             │
│  Cap Rate:          2.8%                   │
│  Cash on Cash:      -11.8%                 │
│  Break Even:        176% occupancy ⚠️      │
│                                             │
│  💡 This property has NEGATIVE cash flow   │
│     Consider: Higher down payment or       │
│     look for properties under NT$6M        │
│                                             │
│  [Compare Properties] [Save Analysis]       │
└─────────────────────────────────────────────┘
```

### Comparison View

```
┌──────────────────────────────────────────────────────┐
│  Investment Comparison                               │
├────────────┬────────────┬────────────┬─────────────┤
│  Property A│  Property B│  Property C│  Property D  │
│  NT$8.5M   │  NT$6.2M   │  NT$7.8M   │  NT$5.5M     │
├────────────┼────────────┼────────────┼─────────────┤
│  Rent      │  Rent      │  Rent      │  Rent        │
│  NT$22K    │  NT$18K    │  NT$20K    │  NT$15K      │
├────────────┼────────────┼────────────┼─────────────┤
│  Cash Flow │  Cash Flow │  Cash Flow │  Cash Flow   │
│  -NT$16.8K │  +NT$2.1K  │  -NT$8.5K  │  +NT$3.2K    │
│  ❌        │  ✅        │  ❌        │  ✅          │
├────────────┼────────────┼────────────┼─────────────┤
│  Cap Rate  │  Cap Rate  │  Cap Rate  │  Cap Rate    │
│  2.8%      │  4.2%      │  3.1%      │  5.1%        │
├────────────┼────────────┼────────────┼─────────────┤
│  CoC       │  CoC       │  CoC       │  CoC         │
│  -11.8%    │  +8.5%     │  -5.2%     │  +12.3%      │
├────────────┼────────────┼────────────┼─────────────┤
│  [View]    │  [View]    │  [View]    │  [View]      │
└────────────┴────────────┴────────────┴─────────────┘

🏆 Best Investment: Property D (5.1% Cap Rate)
```

---

## Implementation Steps

1. **Calculator Engine** (2h)
   - Create investment calculation logic
   - Handle Taiwan-specific tax rates
   - Add amortization schedule

2. **API Endpoints** (1h)
   - Calculate endpoint
   - Property analysis endpoint

3. **UI Widget** (2h)
   - Input form with sliders
   - Results display
   - Positive/negative indicators

4. **Comparison View** (1h)
   - Multi-property comparison
   - Sort by metrics
   - Export to CSV

5. **Integration** (1h)
   - Add calculator button to match cards
   - Pre-fill from listing data
   - Save analyses to user profile

---

# Implementation Priority & Timeline

## Week 1: Core Features

| Day | Task | Features |
|-----|------|----------|
| 1-2 | Price Drop Alerts | Feature 1 |
| 3-4 | Map View | Feature 4 |
| 5 | Multi-Source (start) | Feature 2 |

## Week 2: Data & Reports

| Day | Task | Features |
|-----|------|----------|
| 1-2 | Multi-Source (complete) | Feature 2 |
| 3 | Smart Recommendations | Feature 3 |
| 4-5 | Market Reports (WhatsApp) | Feature 17 |

## Week 3: Advanced Features

| Day | Task | Features |
|-----|------|----------|
| 1-2 | Commute Filter | Feature 7 |
| 3-4 | Image Analysis | Feature 8 |
| 5 | Investment Calculator | Feature 18 |

## Week 4: Polish & Testing

| Day | Task |
|-----|------|
| 1-2 | Integration testing |
| 3 | UI polish & responsive fixes |
| 4 | Performance optimization |
| 5 | Documentation & deployment |

---

# Technical Debt to Address First

Before starting features, fix these:

1. **JWT Secret** - Generate real secret in `.env`
2. **Error Logging** - Add Pino logger
3. **Rate Limiting** - Add to auth endpoints

**Time:** 2-3 hours | **Risk:** High if not done

---

# Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Price Drop | % users who engage | >30% |
| Map View | Avg session duration | +40% |
| Recommendations | CTR on recommendations | >15% |
| Market Reports | WhatsApp open rate | >60% |
| Investment Calc | Saves per user | >2 |

---

**Ready to start implementation!** Which feature should we build first? 🧬
