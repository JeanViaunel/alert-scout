# Alert Scout - Implementation Todo List

## Phase 1: MVP (Core Functionality)

### Week 1: Foundation & Auth

#### Day 1-2: Project Setup
- [x] Initialize Next.js 14 project with App Router
- [x] Configure TypeScript, ESLint, Prettier
- [x] Setup Tailwind CSS with custom color palette
- [x] Install shadcn/ui and initialize components
- [x] Setup Framer Motion for animations
- [x] Create project structure (app/, components/, lib/, types/)
- [x] Configure environment variables (.env.example)

#### Day 3-4: Database & Schema
- [x] Setup SQLite with better-sqlite3
- [x] Create database schema (users, alerts, matches, notifications)
- [x] Create migration scripts
- [x] Setup database connection singleton
- [x] Create TypeScript types for all entities
- [ ] Seed database with test data

#### Day 5-7: Authentication System
- [x] Install & configure bcrypt, jsonwebtoken
- [x] Create auth middleware (protect routes) - Using jose for Edge compatibility
- [x] API: POST /api/auth/register
- [x] API: POST /api/auth/login
- [ ] API: POST /api/auth/refresh
- [ ] API: POST /api/auth/logout
- [x] Frontend: Login page with animations
- [x] Frontend: Register page with form validation
- [x] Frontend: Auth context provider
- [x] Frontend: Protected route wrapper (Middleware)

---

### Week 2: Core UI & Dashboard

#### Day 8-9: Layout & Navigation
- [x] Create root layout with global styles
- [x] Build responsive header with user menu
- [ ] Create sidebar navigation
- [ ] Implement dark/light mode toggle
- [ ] Add loading states (skeleton components)
- [ ] Create error boundary with fallback UI

#### Day 10-11: Dashboard Page
- [x] Dashboard layout with stats cards
- [x] Stats: Active alerts count
- [x] Stats: Total matches found
- [x] Stats: Last check timestamp
- [x] Recent matches preview section
- [x] Quick action buttons
- [x] Empty states with illustrations
- [x] Animation: Card entrance animations

#### Day 12-14: Alert Management UI
- [x] Alert list page with card grid
- [x] Alert status badges (active/paused)
- [x] Alert creation wizard (Step 1: Type)
- [x] Alert creation wizard (Step 2: Criteria)
- [x] Alert creation wizard (Step 3: Review)
- [x] Form validation with Zod
- [ ] Alert detail page
- [x] Edit/Delete alert functionality
- [x] Pause/Resume toggle
- [x] Matches viewing page
- [x] Favorite matches

---

### Week 3: Scraping Engine (Brave API)

#### Day 15-16: Scraping Infrastructure
- [x] Create scraping service architecture
- [x] Implement Cheerio scraper (primary - static HTML)
- [x] Setup Axios with headers/rotation
- [ ] Install Playwright with stealth plugins
- [ ] Implement Playwright scraper (JS-heavy sites)
- [ ] Implement Brave API fallback wrapper
- [x] Setup response parsing utilities
- [x] Create source adapters (591, Momo)
- [x] Add rate limiting per source

#### Day 17-18: 591 Property Scraper
- [x] Map 591 URL patterns and parameters
- [x] Create 591 search URL builder
- [x] Parse 591 listing HTML (Cheerio)
- [x] Extract: Title, price, location, ping, images
- [ ] Handle pagination
- [x] Error handling & retry logic
- [ ] Add parsing tests

#### Day 19-21: Matching Engine
- [x] Create criteria matcher service
- [x] Implement price range matching
- [x] Implement location/district matching
- [x] Implement ping (area) matching
- [x] Implement keyword matching
- [x] Create match scoring algorithm
- [x] Save matches to database
- [x] Prevent duplicate matches (URL dedup)

---

### Week 4: Cron Jobs & Notifications

#### Day 22-23: Job Queue Setup
- [x] Install Bull and Redis
- [x] Create queue connection
- [x] Define job processors structure
- [ ] Setup queue monitoring dashboard
- [x] Create job retry policies

#### Day 24-25: Alert Check Cron
- [x] Create alert check job processor
- [x] Implement intelligent scheduling
- [ ] Group similar queries for efficiency
- [ ] Add job progress tracking
- [ ] Implement circuit breaker pattern
- [x] Create scraping logs table

#### Day 26-28: Notifications
- [ ] Create notification service
- [ ] In-app notification center UI
- [ ] API: GET /api/notifications
- [ ] API: PUT /api/notifications/read
- [ ] Real-time notifications (Server-Sent Events)
- [ ] Toast notification component
- [ ] Email notification setup (Nodemailer)
- [ ] Email templates (new match, welcome)

---

### Week 5: Polish & Testing

#### Day 29-30: Premium UI Polish
- [ ] Add Framer Motion page transitions
- [ ] Implement micro-interactions (buttons, cards)
- [ ] Add loading skeletons to all async components
- [ ] Polish form inputs with focus animations
- [ ] Add hover effects throughout
- [ ] Implement scroll animations (fade-in)
- [ ] Mobile responsiveness audit
- [ ] Dark mode polish

#### Day 31-33: Testing & Bug Fixes
- [ ] Unit tests for utilities
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (auth, alert creation)
- [ ] Performance audit (Lighthouse)
- [ ] Fix critical bugs
- [ ] Security audit (rate limiting, input validation)

#### Day 34-35: Deployment Prep
- [ ] Create Docker configuration
- [ ] Write deployment documentation
- [ ] Setup production environment variables
- [ ] Database backup strategy
- [ ] Create systemd service files
- [ ] Final README with setup instructions

---

## Phase 2: Enhanced Features (Post-MVP)

### Product Alerts (Momo, PChome)
- [ ] Momo scraper adapter
- [ ] PChome scraper adapter
- [ ] Product criteria form (specs, brand, price)
- [ ] Price drop detection
- [ ] Product image gallery

### WhatsApp Notifications
- [ ] WhatsApp Business API integration
- [ ] Message templates for matches
- [ ] User phone verification
- [ ] Opt-in/opt-out preferences

### Advanced Features
- [ ] Match favorites/saved items
- [ ] Price history charts
- [ ] Alert analytics dashboard
- [ ] Public API (GraphQL)
- [ ] Browser extension
- [ ] Mobile app (React Native)

### Performance & Scale
- [ ] Migrate to PostgreSQL
- [ ] Redis cluster setup
- [ ] CDN for images
- [ ] Background job horizontal scaling
- [ ] Webhook notifications

---

## Current Status

**Phase 1 Progress:** 0/35 tasks complete

**Next Action:** Initialize Next.js project

**Estimated MVP Completion:** 5 weeks

**Blockers:** None
