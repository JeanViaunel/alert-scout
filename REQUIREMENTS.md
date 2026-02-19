# Project Requirements: Alert Scout Platform

## Overview
A multi-purpose alert system for tracking rental properties and e-commerce deals. Users set search criteria, and the system monitors multiple sources (591, Momo, etc.) via scheduled scraping, notifying users when matches are found.

---

## 1. User System

### User Profile
| Field | Required | Type | Notes |
|-------|----------|------|-------|
| id | Yes | UUID | Primary key |
| email | Yes | String | Unique, used for login |
| name | Yes | String | Display name |
| phone | No | String | Optional, for WhatsApp/SMS alerts |
| password_hash | Yes | String | Bcrypt hashed |
| created_at | Yes | DateTime | Auto-generated |
| updated_at | Yes | DateTime | Auto-updated |
| alert_preferences | No | JSON | Default notification settings |

### Authentication
- JWT-based auth (access token + refresh token)
- Login with email/password
- Password reset via email
- Session management (logout from all devices)

---

## 2. Search Alert System (Core)

### Alert Types
1. **Property Alerts** (591, etc.)
2. **Product Alerts** (Momo, PChome, etc.)

### Alert Entity Schema
```
Alert {
  id: UUID
  user_id: UUID (FK)
  type: "property" | "product"
  name: String (user-friendly name)
  criteria: JSON (search parameters)
  sources: String[] (which sites to monitor)
  is_active: Boolean
  check_frequency: "5min" | "15min" | "30min" | "1hour" | "daily"
  last_checked: DateTime
  last_match_count: Int
  created_at: DateTime
  notify_methods: ["app" | "email" | "whatsapp"]
}
```

### Property Alert Criteria
| Field | Type | Example |
|-------|------|---------|
| city | String | "hsinchu" |
| districts | String[] | ["east", "north"] |
| min_price | Int | 5000 |
| max_price | Int | 20000 |
| min_ping | Float | 5.0 |
| max_ping | Float | 30.0 |
| property_type | String[] | ["apartment", "suite"] |
| rooms | Int | 2 |
| keywords | String[] | ["parking", "balcony"] |

### Product Alert Criteria
| Field | Type | Example |
|-------|------|---------|
| source | String | "momo" |
| category | String | "smartphone" |
| brand | String[] | ["apple", "samsung"] |
| min_price | Int | 15000 |
| max_price | Int | 30000 |
| specs | JSON | {"ram": "8GB", "storage": "256GB"} |
| keywords | String[] | ["promotion", "discount"] |

---

## 3. Scraping & Data Sources

### Supported Sources - Phase 1
| Source | Type | URL Pattern | Rate Limit | Method |
|--------|------|-------------|------------|--------|
| 591 Rent | Property | rent.591.com.tw | 1 req/min | Brave API → Cheerio fallback |
| Momo | Product | www.momo.com.tw | 1 req/5min | Brave API → Puppeteer fallback |

### Supported Sources - Phase 2
| Source | Type | Priority |
|--------|------|----------|
| PChome | Product | Medium |
| Shopee | Product | Medium |
| 信義房屋 | Property | Low |
| 永慶房屋 | Property | Low |

### Scraping Strategy (Primary: Direct Scraping)
1. **Standard HTTP + Cheerio** (Primary)
   - Axios for HTTP requests
   - Cheerio for fast HTML parsing (jQuery-like selectors)
   - Zero browser overhead, maximum speed
   - Used for static sites (591 listings, most e-commerce)

2. **Playwright/Puppeteer** (Secondary)
   - Full browser automation for JS-heavy sites
   - Handles SPAs, lazy loading, infinite scroll
   - Headless mode with stealth plugins
   - Used when Cheerio fails or site requires JS

3. **Brave Search API** (Fallback)
   - Use `web_fetch` tool when direct scraping is blocked
   - Built-in rate limiting and content extraction
   - Markdown format for easy parsing
   - Last resort when other methods fail

4. **Caching**: Redis for responses (TTL: 5-15 min)
5. **Delta Updates**: Track listing IDs, only process new
6. **Circuit Breaker**: Auto-disable failing sources
7. **Proxy Rotation**: Optional for high-volume scraping

---

## 4. Caching Strategy

### Cache Layers
1. **Response Cache** (Redis)
   - Key: `source:{source_name}:query:{hash}`
   - TTL: 5-15 minutes
   - Stores raw HTML/JSON responses

2. **Results Cache** (Redis)
   - Key: `alert:{alert_id}:results`
   - TTL: 1 hour
   - Stores parsed/matched results

3. **Session Cache** (Redis)
   - Key: `session:{user_id}:{token}`
   - TTL: 24 hours
   - JWT session storage

### Cache Invalidation
- Manual refresh by user
- Source-specific invalidation
- Time-based expiration

---

## 5. Notification System

### Notification Channels
| Channel | Priority | Implementation |
|---------|----------|----------------|
| In-app | P0 | Real-time via WebSocket |
| Email | P1 | SMTP/API (SendGrid) |
| WhatsApp | P2 | WhatsApp Business API |

### Notification Triggers
- New match found
- Price drop on existing match
- Alert reaching expiry
- System maintenance notice

### Notification Entity
```
Notification {
  id: UUID
  user_id: UUID
  alert_id: UUID
  type: "new_match" | "price_drop" | "system"
  title: String
  message: String
  data: JSON (match details)
  is_read: Boolean
  created_at: DateTime
}
```

---

## 6. Cron Job Architecture

### Job Scheduler (node-cron / Bull Queue)

**Alert Check Job**
```javascript
// Runs every 5 minutes
// 1. Get all active alerts
// 2. Group by source & rate limit
// 3. Fetch data (with cache check)
// 4. Parse and match against criteria
// 5. Create notifications for new matches
// 6. Update alert.last_checked
```

**Queue Design**
- Priority queue: High-frequency alerts first
- Batch processing: Group similar queries
- Deduplication: Same URL in 1 hour = skip

### Resource Optimization
- **Smart Scheduling**: Spread checks across the hour
- **Query Deduplication**: Same criteria = shared fetch
- **Incremental Scraping**: Only fetch first page, track IDs
- **Circuit Breaker**: Stop checking failing sources

---

## 7. Database Schema (SQLite)

### Tables
1. `users` - User profiles
2. `alerts` - Search alerts
3. `matches` - Found items matching alerts
4. `notifications` - User notifications
5. `scraping_logs` - Scraping history & errors
6. `cache_metadata` - Cache tracking

### Key Indexes
- `alerts(user_id, is_active)` - Quick active alert lookup
- `matches(alert_id, created_at)` - Match history
- `matches(source_url)` - Deduplication

---

## 8. API Endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`

### Alerts
- GET `/api/alerts` - List user's alerts
- POST `/api/alerts` - Create new alert
- GET `/api/alerts/:id` - Get alert details
- PUT `/api/alerts/:id` - Update alert
- DELETE `/api/alerts/:id` - Delete alert
- POST `/api/alerts/:id/check` - Manual trigger

### Matches
- GET `/api/matches` - List matches across all alerts
- GET `/api/alerts/:id/matches` - Matches for specific alert
- POST `/api/matches/:id/favorite` - Save match
- DELETE `/api/matches/:id/favorite` - Unsave

### Notifications
- GET `/api/notifications` - List notifications
- PUT `/api/notifications/:id/read` - Mark as read
- PUT `/api/notifications/read-all` - Mark all read

### User
- GET `/api/user/profile`
- PUT `/api/user/profile`
- PUT `/api/user/preferences`

---

## 9. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + TypeScript + Tailwind + shadcn/ui + Framer Motion |
| Backend | Next.js API Routes (App Router) |
| Database | SQLite (better-sqlite3) |
| Cache | Redis (ioredis) / LRU Cache (fallback) |
| Queue | Bull + Redis |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Scraping | **Cheerio** → Playwright → **Brave API** (fallback) |
| Cron | node-cron + Bull workers |
| Notifications | Nodemailer + WhatsApp Web.js |
| Animations | Framer Motion + GSAP |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |

---

## 10. UI/UX Requirements (Premium Design)

### Design System
- **Style**: Modern minimalist, premium SaaS aesthetic
- **Color Palette**: 
  - Primary: Deep indigo/slate (#4F46E5)
  - Secondary: Soft teal/emerald (#10B981)
  - Accent: Warm amber for alerts (#F59E0B)
  - Background: Pure white + subtle slate grays
- **Typography**: Inter or Geist font family, clean hierarchy
- **Spacing**: Generous whitespace, 8px grid system
- **Shadows**: Soft, layered shadows (0 4px 6px -1px rgba(0,0,0,0.1))
- **Radius**: Consistent 8px-16px border radius
- **Animations**: Smooth 300ms transitions, staggered reveals

### Pages
1. **Landing** 
   - Full-screen hero with gradient mesh background
   - Animated feature cards with hover effects
   - Social proof section
   - CTA with micro-interactions

2. **Dashboard**
   - Overview cards with real-time stats (pulse animation for active)
   - Recent matches carousel/grid
   - Quick-action floating button
   - Activity timeline

3. **Alert Create** 
   - Step wizard with progress indicator
   - Animated form sections
   - Live preview panel (shows example matches)
   - Criteria chips with delete animation

4. **Alert List**
   - Card grid with status badges
   - Skeleton loading states
   - Empty state with illustration
   - Bulk actions toolbar

5. **Alert Detail**
   - Match history with infinite scroll
   - Price trend chart (if applicable)
   - Stats cards (matches found, last check)
   - Action buttons with confirmation modals

6. **Matches**
   - Masonry grid layout
   - Image hover zoom
   - Price highlight animation
   - Favorite/bookmark with heart animation

7. **Profile**
   - Settings organized in tabs
   - Avatar upload with crop preview
   - Notification preference toggles
   - Danger zone (delete account)

8. **Notifications**
   - Sliding panel (not page reload)
   - Unread badge with bounce animation
   - Mark all as read with sweep effect
   - Grouped by date

### Premium Interactions
- **Page transitions**: Fade + slide (Framer Motion AnimatePresence)
- **Loading states**: Skeleton screens, not spinners
- **Micro-interactions**: 
  - Button press scale (0.98)
  - Card hover lift (translateY -4px + shadow increase)
  - Input focus glow
  - Toggle switch spring animation
- **Toast notifications**: Slide in from top-right, auto-dismiss
- **Modal animations**: Scale up + backdrop blur
- **Real-time updates**: Smooth list item insertion (layout animation)
- **Scroll behaviors**: Parallax hero, sticky headers

### Responsive Breakpoints
- Mobile: < 640px (single column, bottom nav)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (full layout, sidebar)
- Large: > 1280px (max-width container)

---

## 11. MVP Scope (Phase 1)

**Included:**
- User auth (email/password)
- Property alerts for 591 (Hsinchu only)
- Basic caching (in-memory LRU)
- Email notifications
- Dashboard + Alert CRUD
- Manual refresh button

**Excluded (Phase 2):**
- Product alerts (Momo)
- Redis cache
- WhatsApp notifications
- Advanced filtering (keywords)
- Public API
- Mobile app

---

## 12. Security Considerations

- Rate limiting per IP + per user
- Input validation (zod schema)
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize HTML)
- Scraper bot detection evasion
- User data encryption at rest

---

## Open Questions

1. **Hosting**: Where will this run? (VPS/Raspberry Pi/Cloud)
2. **Scale**: Expected users? (10s / 100s / 1000s)
3. **Budget**: Any paid APIs needed? (SendGrid, scraping proxy)
4. **WhatsApp**: Should alerts come to your WhatsApp number?
5. **Monetization**: Free / Freemium / Subscription?

---

## Approval Checklist

- [ ] Requirements reviewed
- [ ] MVP scope agreed
- [ ] Tech stack approved
- [ ] Database schema confirmed
- [ ] Timeline discussed

**Ready to implement after your approval!**
