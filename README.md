# TaleTogether

TaleTogether is a **full-stack story-sharing and writing-growth platform MVP**.

It combines:

- story publishing
- writing improvement feedback
- writer profiles
- reader engagement
- challenge-based community loops
- optional AI-assisted writing help

## What this version includes

### Frontend

- React 19 + TypeScript + Vite
- Discover feed with search/filter/sort
- Story detail pages
- Writer profiles
- Auth pages
- Writing editor with chapter support
- Live Writer Score
- Cover gradients + image cover uploads

### Backend

- Express API
- SQLite database via `better-sqlite3`
- JWT authentication
- Local file uploads for story covers
- Seeded community data
- AI assist endpoint with:
  - OpenAI support when `OPENAI_API_KEY` is configured
  - local fallback behavior when it is not

## Core product flows implemented

- Register / sign in
- Read public stories
- Publish public or private stories
- Like stories
- Comment on stories
- Follow writers
- Save genre preferences
- Upload a cover image
- Use the writing assistant endpoint

## Tech stack

### Client

- React
- TypeScript
- React Router
- Vite
- Custom CSS

### Server

- Node.js
- Express
- SQLite
- JWT
- Multer
- Zod

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set values as needed.

```bash
cp .env.example .env
```

Important variables:

- `PORT` — API port, defaults to `8787`
- `JWT_SECRET` — signing secret for auth tokens
- `OPENAI_API_KEY` — optional, enables real AI responses
- `OPENAI_MODEL` — optional, defaults to `gpt-4.1-mini`

### 3. Run the app

```bash
npm run dev
```

This starts:

- the Vite frontend
- the Express API server

## Production build

```bash
npm run build
```

## Demo account

A seeded demo user is included for faster testing:

- Email: `demo@taletogether.app`
- Password: `demo12345`

## Data/storage notes

- SQLite database file is created in `data/taletogether.db`
- Uploaded images are stored in `uploads/covers`
- Drafts are still saved locally in browser `localStorage`
- Published stories, auth, likes, follows, comments, and preferences are API/database backed

## Project structure

- `src/` — React frontend
- `server/` — Express API and SQLite logic
- `uploads/` — uploaded cover images
- `data/` — local SQLite database

## Suggested next steps

If you want to continue building the startup version, the highest-value next upgrades are:

1. add refresh tokens / secure cookie auth
2. move uploads to S3 or Cloudinary
3. add bookmarking and notifications
4. add premium stories / monetization
5. add collaborative writing and draft autosave to the backend
6. expand AI features into structured editing tools and book generation
