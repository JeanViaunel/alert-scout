# Alert Scout

Smart Price & Property Alerts - Track rental properties and product deals automatically.

## Features

- ✅ **Property Alerts** - Monitor 591.com.tw for rental listings
- ✅ **Smart Filtering** - Price, area, rooms, keywords
- ✅ **Auto-Check** - Runs every 15 minutes via cron
- ✅ **Match History** - Save and favorite listings
- ✅ **Email Ready** - Extensible for notifications

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, better-sqlite3
- **Scraping:** Cheerio, Axios, Playwright (optional)
- **Cron:** node-cron

## Quick Start

### 1. Install Dependencies

```bash
cd alert-scout
npm install
```

### 2. Initialize Database

```bash
npm run db:init
```

This creates SQLite tables in `data/app.db`.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (default values work for development).

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Usage

### 1. Create Account
- Go to http://localhost:3000/register
- Enter name, email, password

### 2. Create Alert
- Go to Dashboard → Create Alert
- Select city (e.g., Hsinchu)
- Set price range, area, rooms
- Add keywords (optional)
- Choose check frequency

### 3. Manual Check (Optional)

```bash
curl -X POST http://localhost:3000/api/queue \
  -H "Content-Type: application/json" \
  -d '{"action":"trigger"}'
```

### 4. View Matches
- Go to http://localhost:3000/matches
- See all matching listings
- Favorite interesting ones

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/user/profile` | Get user info |
| POST | `/api/alerts` | Create alert |
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts/check` | Manual check |
| GET | `/api/matches` | List matches |
| POST | `/api/queue` | Control scheduler |

## Database Schema

### Users
- id, email, name, phone, password_hash

### Alerts
- id, user_id, type, name, criteria, sources
- is_active, check_frequency, last_checked, last_match_count

### Matches
- id, alert_id, title, price, location, area
- image_url, source_url, source, is_favorite

## Cron Schedule

- Runs every 15 minutes automatically
- Checks all active alerts
- Scrapes 591 for new listings
- Saves matches to database

## Production Deployment

### Build

```bash
npm run build
npm start
```

### Environment Variables

```bash
DATABASE_URL="./data/app.db"
JWT_SECRET="your-super-secret-key"
REDIS_URL="redis://localhost:6379"
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### "no such table: users"
Run `npm run db:init` to create tables.

### Scraping fails
591 may block requests. The app will retry automatically.

### Port already in use
Change port: `npm run dev -- -p 3001`

## License

MIT
