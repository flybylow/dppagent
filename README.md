# DPP Scanner Agent

Autonomous intelligence system for discovering and analyzing Digital Product Passports from competitors.

## ✨ Features

- 🚀 **Quick JSON-LD Scraper** - Fetch and save DPP data from any URL or DID
- 🆔 **DID Browser** - Resolve Decentralized Identifiers with service endpoint detection
- 🧪 **Test Lab** - Test real DPP sources (Spherity, Unilever, Eclipse)
- 📋 **Schema Browser** - Explore JSON-LD contexts and schemas
- 🔗 **Linked Data Explorer** - Follow @id references to build complete data graphs
- 💾 **Database Storage** - Auto-save with clean/original versions
- 📊 **Real-time Stats** - Track scraped DPPs, success rates, activity

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations in Supabase SQL Editor
# See: /docs/SETUP_NEW_DASHBOARD.md

# Run development server
npm run dev
```

**Note:** If port 3000 is taken, Next.js will auto-increment to 3001, 3002, etc. Check terminal output for the actual port.

Open http://localhost:3000 (or check terminal for actual port)

## Project Structure

```
dppagent/
├── app/
│   ├── page.tsx                    # Dashboard - Quick scraper
│   ├── did-browser/                # DID resolution tool
│   ├── test/                       # Multi-source testing lab
│   ├── schemas/                    # Schema & context browser
│   ├── competitors/                # Competitor management
│   └── api/                        # API routes
├── components/
│   ├── LinkExpander.tsx            # JSON-LD link expansion
│   ├── EndpointExplorer.tsx        # API endpoint testing
│   └── GraphViewer.tsx             # Data graph visualization
├── lib/
│   ├── scraper.ts                  # DPP scraping service
│   ├── jsonld-resolver.ts          # Linked data resolution
│   ├── dpp-utils.ts                # DID conversion, format detection
│   └── supabase.ts                 # Database client
├── supabase/
│   ├── migrations/                 # SQL migrations
│   └── config.toml
├── docs/                           # Private documentation (not in git)
└── public/
```

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Deployment:** Vercel

## Documentation

See `/docs` folder for detailed documentation (private, not in git).

## 🎯 Working Examples

The scraper works with these real DPP sources:

- **Eclipse Tractus-X** - Catena-X Battery Pass (complete product data)
- **Spherity** - Verifiable Credentials with DID support
- **Unilever SmartLabel** - GS1 Digital Link (8 API endpoints!)
- **Hershey's SmartLabel** - Food product DPPs
- **Battery Pass Schema** - Official data models
- **W3C Contexts** - JSON-LD vocabulary definitions

## 📚 Documentation

See `/docs` folder for 24 comprehensive guides (private, not in git):
- Quick start guides
- Feature documentation
- Technical references
- Development learnings

**Start here:** `/docs/DASHBOARD_SCRAPER.md`

## Development Rules

1. Keep root clean - organize code in proper folders
2. Update docs when big learnings happen
3. Docs are private - never commit to GitHub

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Parsing:** Cheerio (HTML), native JSON
- **Storage:** PostgreSQL with JSONB
- **Deployment:** Vercel-ready

## License

Private Project - All Rights Reserved

