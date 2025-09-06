# Quizzi - Real-Time 1v1 Trivia Game

Quizzi is a modern web application that allows users to compete in real-time trivia matches, inspired by the popular QuizUp app.

## Features

- 🎯 Topic Selection from various topics
- ⚡ Real-Time 1v1 Matches with 7-question rounds
- 👤 Anonymous play or User Accounts with nickname/email
- 📝 Extensive Question Bank
- 📊 Match Results & Score Tracking
- 📱 Mobile-Friendly Design
- 🚀 Free-tier deployment on Vercel (frontend) and Supabase (backend)

## Tech Stack

- **Frontend**: Next.js with TypeScript & Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime subscriptions)
- **Deployment**: Vercel (frontend) and Supabase (backend)

## Project Structure

```
quizzi/
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # UI Components
│   ├── lib/                     # Utilities & Shared Logic
│   │   └── supabase/            # Supabase Client & Types
│   ├── types/                   # TypeScript Type Definitions
│   └── features/                # Feature-based components & logic
│       ├── auth/                # Authentication
│       ├── topics/              # Topic Selection
│       ├── game/                # Game Logic & UI
│       └── results/             # Results & Scoring
└── public/                      # Static Assets
```

## Deployment
The web app has been deployed using vercel. You can check it out at: https://quizzi-eight.vercel.app/
