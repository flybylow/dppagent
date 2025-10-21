# DPP Scanner Agent

Autonomous intelligence system for discovering and analyzing Digital Product Passports from competitors.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dppagent/
├── app/                 # Next.js 14 app directory
├── components/          # React components
├── lib/                 # Utilities & helpers
├── supabase/           # Database & functions
├── docs/               # Private documentation (not in git)
└── public/             # Static assets
```

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Deployment:** Vercel

## Documentation

See `/docs` folder for detailed documentation (private, not in git).

## Development Rules

1. Keep root clean - organize code in proper folders
2. Update docs when big learnings happen
3. Docs are private - never commit to GitHub

## License

Private Project - All Rights Reserved

