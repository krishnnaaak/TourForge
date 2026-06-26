# TourForge — AI-Powered Spatial Tour Builder

> Upload images of any space, place interactive hotspots, and generate AI descriptions for each area. Built for real estate, architecture, and interior design.

**Live Demo:** _coming soon_  
**Tech Stack:** React · TypeScript · Node.js · Express · MongoDB · Gemini AI

---

## Features

- **Image upload** with server-side storage (multer → disk)
- **Interactive hotspot placement** by clicking anywhere on an image
- **AI content generation** per hotspot (description, accessibility notes, sales copy)
- **Job queue with retry + exponential backoff** — no dropped requests even if Gemini is slow
- **Graceful fallback** — users always see content, even if AI fails
- **JWT authentication** — each user sees only their own tours
- **Async UI states** — uploading → queued → processing → retrying → complete/failed
- **Persistent sessions** — all data survives page refreshes (MongoDB + server-side storage)

---

## System Design

```
Browser (React + TypeScript)
        |
        | REST API (axios, JWT in headers)
        |
Node.js + Express (backend)
        |
   ┌────┴────┐
   │         │
Gemini AI  MongoDB
(proxy)    (tours, hotspots, users)
```

### Why the backend proxies all AI calls

API keys are never sent to the browser. All Gemini requests go through `/api/hotspots/:id/generate`. This is the **AI Proxy Pattern** — used in production by any company that integrates third-party AI. Anyone opening DevTools cannot steal the key.

### Queue & Retry Architecture

When a user clicks "Generate AI Content":

1. Backend creates a job in an in-memory FIFO queue
2. Returns `{ status: "queued" }` **immediately** — no waiting
3. Worker picks the job and calls Gemini
4. On failure: retries with exponential backoff (1s → 2s → 4s)
5. After 3 failures: saves a fallback response — the UI never shows a blank
6. Frontend polls `/api/hotspots/:id` every 2s until terminal state

```
User clicks Generate
        │
POST /hotspots/:id/generate
        │
Job added to queue ──→ returns { status: "queued" }
        │
Worker picks job
        │
    ┌───┴───┐
    │       │
  Success  Fail
    │       │
  Save    Retry (backoff)
  result    │
           3 attempts → fallback
```

### Hotspot Status Lifecycle

```
pending → processing → completed
                    ↘ failed (with fallback content)
```

This mirrors how production job systems work (AWS SQS, BullMQ, Celery).

### Why polling instead of WebSockets?

For this scale (single user, small queue), HTTP polling every 2 seconds is simpler and sufficient. The trade-off: ~2s latency vs the complexity of maintaining a WebSocket connection per client. In a high-traffic production system, you'd use SSE or WebSockets for real-time push.

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB running locally, Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone and install

```bash
git clone https://github.com/yourusername/tourforge
cd tourforge

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — add your MONGODB_URI and GEMINI_API_KEY
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

App runs at `http://localhost:5173`

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/tours` | Create tour |
| GET | `/api/tours` | List my tours |
| GET | `/api/tours/:id` | Get tour + hotspots |
| POST | `/api/upload/:tourId` | Upload image to tour |
| POST | `/api/hotspots` | Create hotspot |
| GET | `/api/hotspots/:id` | Poll hotspot status |
| POST | `/api/hotspots/:id/generate` | Trigger AI generation |

---

## Project Structure

```
tourforge/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # JWT auth
│   │   ├── models/         # Mongoose schemas
│   │   ├── queue/          # Job queue + worker
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Gemini AI proxy
│   │   └── utils/          # DB connection
│   └── uploads/            # Server-side image storage
└── frontend/
    └── src/
        ├── components/
        │   └── tour/       # Canvas, markers, panel
        ├── hooks/          # Auth context, hotspot poller
        ├── pages/          # Dashboard, TourEditor, Auth
        ├── services/       # Axios client
        └── types/          # TypeScript interfaces
```

---

## Known Limitations (Radical Honesty)

This section exists because shipping honest software matters more than pretending the system is flawless.

| Limitation | Impact | Production Fix |
|------------|--------|----------------|
| **In-memory queue** | Jobs are lost if the server restarts mid-processing | Replace with Bull + Redis for persistent, crash-safe queuing |
| **Local disk storage** | Images live on the server filesystem — won't work across multiple server instances | Migrate to AWS S3 or Cloudflare R2 with signed URLs |
| **Polling instead of WebSockets** | Status updates have ~2s latency; adds unnecessary HTTP traffic | Use SSE or WebSockets for real-time push |
| **Single-worker queue** | One job processed at a time; under high load, queue grows linearly | Add worker concurrency (Bull supports this natively) |
| **No image deletion** | Uploaded files persist on disk even if removed from a tour in DB | Add cleanup job or hook into Tour/Hotspot delete to unlink files |
| **No test suite** | Logic correctness is manual — queue, retry, fallback untested automatically | Add Jest + Supertest for backend, React Testing Library for frontend |

---

## What I'd Add With More Time

- **Redis + Bull** for persistent queue (survives server restarts)
- **AWS S3** for image storage instead of local disk
- **WebSocket or SSE** for real-time status pushes instead of polling
- **Tour sharing** via public links
- **360° panorama viewer** using Three.js / Panolens
- **Rate limiting** per user per hour on AI generation

---

## Skills Demonstrated

| Area | What's shown |
|------|-------------|
| Frontend | React, TypeScript, async state, file uploads, canvas interactions |
| Backend | Express, JWT auth, REST design, Multer, error handling |
| Database | MongoDB schema design, relationships, cascade deletes |
| AI | Gemini integration, prompt engineering, AI proxy pattern |
| System Design | Job queues, retry logic, exponential backoff, fallback handling |
| Engineering | Defensive coding, meaningful status tracking, clean Git commits |
