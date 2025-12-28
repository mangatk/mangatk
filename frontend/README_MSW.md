# MSW (Mock Service Worker) - Development Guide

## Overview

This project now includes **Mock Service Worker (MSW)** support, allowing frontend development without a running backend. MSW intercepts network requests in the browser and returns mock data that matches the exact shape of the real API.

## Quick Start

### Enable Mock Mode

1. **Update your environment file:**
   ```bash
   # In frontend/.env.local
   NEXT_PUBLIC_USE_MOCKS=true
   ```

2. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Check the console** - You should see:
   ```
   [MSW] 🎭 Mock Service Worker started successfully
   [MSW] 📡 Intercepting API calls to: http://localhost:8000/api
   ```

### Disable Mock Mode

```bash
# In frontend/.env.local
NEXT_PUBLIC_USE_MOCKS=false
```

## Features

✅ **50+ API Endpoints Mocked** - All endpoints used in the frontend are covered  
✅ **Exact Response Shapes** - Mock data matches backend DRF pagination and response format  
✅ **Full CRUD Support** - Create, Read, Update, Delete operations work as expected  
✅ **Authentication Flow** - Login, register, and token refresh working  
✅ **State Persistence** - Changes persist during development session  
✅ **No Code Changes** - Your existing API calls work unchanged  

## How It Works

### Architecture

```
Frontend Component/Page
    ↓
fetch(API_URL + '/manga/')
    ↓
MSW intercepts (if NEXT_PUBLIC_USE_MOCKS=true)
    ↓
handlers.ts routes to correct handler
    ↓
Mock data returned from data/*.ts
    ↓
Component receives data (same shape as real API)
```

### Key Files

```
frontend/
├── src/
│   └── mocks/
│       ├── browser.ts              # MSW browser setup
│       ├── handlers.ts             # All API endpoint handlers
│       ├── MSWProvider.tsx         # React component wrapper
│       └── data/                   # Mock data files
│           ├── manga.ts
│           ├── chapters.ts
│           ├── users.ts
│           ├── comments.ts
│           ├── achievements.ts
│           ├── ratings.ts
│           ├── bookmarks.ts
│           ├── history.ts
│           ├── subscriptions.ts
│           ├── ai.ts
│           ├── notifications.ts
│           ├── genres.ts
│           └── categories.ts
└── public/
    └── mockServiceWorker.js        # Service Worker (auto-generated)
```

## Available Mock Data

### Manga
- 8 pre-loaded manga (Attack on Titan, One Piece, Naruto, Solo Leveling, etc.)
- Supports filtering, search, pagination
- Featured manga list available

### Users
- 3 mock users (admin, user1, user2)
- Full authentication flow
- Points and achievements system

### Chapters
- 7 sample chapters across different manga
- Page images included
- Navigation (prev/next chapter)

### Comments
- Nested comments with replies
- Like functionality
- Real-time creation

### Other Data
- 10 genres
- 4 categories
- 8 achievements
- 4 subscription plans
- AI translation models and jobs
- Reading history
- Bookmarks/favorites

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_USE_MOCKS` | Enable/disable MSW | `false` |
| `NEXT_PUBLIC_IMGBB_API_KEY` | ImgBB API key (optional) | - |

## Development Workflows

### Scenario 1: Frontend-Only Development
**Use Case:** Backend is not available, or you want to develop UI independently

```bash
# Enable mocks
NEXT_PUBLIC_USE_MOCKS=true npm run dev
```

All API calls will be intercepted and return mock data.

### Scenario 2: Full Stack Development
**Use Case:** Backend is running, test against real data

```bash
# Disable mocks
NEXT_PUBLIC_USE_MOCKS=false npm run dev
```

All API calls go to the real backend at `NEXT_PUBLIC_API_URL`.

### Scenario 3: Mixed Mode (Advanced)
You can temporarily disable MSW in code:
```typescript
// In specific component
if (typeof window !== 'undefined') {
  worker.stop()
}
```

## Covered API Endpoints

### Authentication (3 endpoints)
- `POST /auth/login/`
- `POST /auth/register/`
- `POST /auth/refresh/`

### Manga (6 endpoints)
- `GET /manga/` (with filters)
- `GET /manga/featured/`
- `GET /manga/:id/`
- `POST /manga/:id/increment_views/`
- `POST /manga/`
- `PUT /manga/:id/`
- `DELETE /manga/:id/`

### Chapters (5 endpoints)
- `GET /chapters/:id/`
- `POST /chapters/:id/increment_views/`
- `POST /chapters/`
- `PATCH /chapters/:id/`
- `DELETE /chapters/:id/`

### Comments (5 endpoints)
- `GET /comments/?chapter=:id`
- `POST /comments/`
- `POST /comments/:id/like/`
- `PATCH /comments/:id/`
- `DELETE /comments/:id/`

### Plus: Ratings, Bookmarks, History, Achievements, Categories, Genres, Subscriptions, AI Translation, Notifications, Dashboard Stats (30+ more endpoints)

## Customizing Mock Data

### Add New Manga

```typescript
// src/mocks/data/manga.ts
export const mockMangaList = [
  // ... existing manga
  {
    id: 9,
    title: 'Your New Manga',
    description: 'Description here',
    cover_image_url: 'https://...',
    chapter_count: 0,
    avg_rating: '0.0',
    // ... other fields
  }
]
```

### Modify Response Behavior

```typescript
// src/mocks/handlers.ts
http.get(`${API_BASE}/manga/:id/`, ({ params }) => {
  // Add custom logic here
  const manga = getMangaById(Number(params.id))
  
  // Example: Add delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return HttpResponse.json(manga)
})
```

## Troubleshooting

### MSW Not Starting

**Problem:** Console shows no MSW messages

**Solution:**
1. Check `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`
2. Ensure you're in development mode (`npm run dev`, not `npm start`)
3. Clear browser cache and reload

### Service Worker Registration Failed

**Problem:** Console error about service worker

**Solution:**
```bash
cd frontend
npx msw init public/ --save
```

### Requests Going to Real Backend

**Problem:** Network tab shows requests to `localhost:8000`

**Solution:**
1. Verify `NEXT_PUBLIC_USE_MOCKS=true`
2. Restart dev server
3. Check browser console for MSW initialization messages

### Mock Data Not Updating

**Problem:** Changes to mock data files not reflecting

**Solution:**
1. Restart dev server (Next.js caches imports)
2. Clear browser cache
3. Check for TypeScript errors

## Production Builds

MSW is **automatically disabled** in production builds. The condition:

```typescript
if (process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_USE_MOCKS === 'true')
```

Ensures MSW only runs in development when explicitly enabled.

### Verify Production Build

```bash
npm run build
npm start
```

Check that:
- No MSW console messages appear
- Requests go to real backend
- No service worker registered

## Best Practices

1. **Always commit mock data files** - Team members need them
2. **Keep .env.local in .gitignore** - Personal settings
3. **Update mock data when API changes** - Keep in sync with backend
4. **Test both modes** - Verify real API and mocks work
5. **Document custom data** - Add comments for complex mock scenarios

## Additional Resources

- [MSW Documentation](https://mswjs.io/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- Project API Endpoints: See `/artifacts/api_endpoints_extraction.md`

---

**Happy Mocking! 🎭**
