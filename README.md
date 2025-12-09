# YouDroppedThis

A collaborative pixel art canvas where users can place temporary artworks that other users can collect before they expire.

## Quick Start

### Backend (Deno)

```bash
cd youdroppedthis-api
deno task dev
```

### Frontend (Vue3)

```bash
cd youdroppedthis-client
npm install
npm run dev
```

## Features

- 🎨 **Pixel Art Creation**: Simple editor with multiple resolutions (16x16, 32x32, 64x64)
- 🗺️ **Finite Canvas**: Place artwork anywhere on the canvas
- ⏰ **Time-based Expiration**: Artworks disappear after 24 hours if not collected
- 💰 **Economy System**: Placement costs coins, collecting is free
- 🔄 **Real-time Updates**: See changes instantly via WebSockets
- 👤 **User Accounts**: Registration required for placing and collecting
- 🎁 **Daily Bonuses**: Free coins for active users

## Tech Stack

- **Backend**: Deno + Oak (TypeScript)
- **Frontend**: Vue 3 + Vite + Pinia + Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase realtime
- **Authentication**: Supabase auth
