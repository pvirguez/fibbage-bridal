# 💍 Fibbage - Bridal Shower Edition

A fun Fibbage-style party game for Cristi & Juanqui's bridal shower! Players submit fake answers to questions about the couple, then everyone votes on which one is the truth.

## Game Flow

1. **Host creates a room** on the TV/computer
2. **Players join** from their phones using the room code
3. **For each question:**
   - Players submit a fake answer (30 seconds)
   - Everyone votes for the truth (20 seconds)
   - Results are shown with scores
4. **Final podium** after all 15 questions

## Scoring

- **+1000 points** for voting for the truth
- **+500 points** for each person who votes for your lie

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + Socket.IO
- **Deployment:** Frontend on Vercel, Backend on Railway

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on http://localhost:3000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:5173

---

## 📦 Deployment Guide

### Step 1: Deploy Backend to Railway

1. **Go to [Railway.app](https://railway.app)** and sign in
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select** your `fibbage-bridal` repository
4. **Configure the service:**
   - Root directory: `backend`
   - Build command: (leave empty)
   - Start command: `npm start`
5. **Add environment variables:**
   - Click on the service → "Variables" tab
   - Add: `PORT` = `3000`
   - Add: `FRONTEND_URL` = (you'll update this after deploying frontend)
6. **Copy your Railway URL** (looks like: `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign in
2. **Click "Add New..."** → "Project"
3. **Import** your GitHub repository
4. **Configure the project:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add environment variable:**
   - Click "Environment Variables"
   - Add: `VITE_SOCKET_URL` = `https://your-app.railway.app` (your Railway URL)
6. **Deploy!**
7. **Copy your Vercel URL** (looks like: `https://your-app.vercel.app`)

### Step 3: Update Backend CORS

1. **Go back to Railway**
2. **Update environment variable:**
   - `FRONTEND_URL` = `https://your-app.vercel.app` (your Vercel URL)
3. **Redeploy** the backend (it should auto-deploy)

---

## 🎮 How to Play

### For the Host (TV/Computer)

1. Open the game URL in a browser
2. Click "Host Game (TV)"
3. Click "Create Room"
4. **Share the 4-digit room code** with players (it will be shown large on screen)
5. Wait for players to join
6. Click "Start Game" when everyone is ready
7. After each question's results, click "Next Question"
8. At the end, a podium will show the winners!

### For Players (Mobile)

1. Open the game URL on your phone
2. Click "Join Game (Player)"
3. Enter the room code and your nickname
4. Wait for the host to start
5. For each question:
   - Write a convincing fake answer
   - Vote for what you think is the truth
6. See your final rank at the end!

---

## 📝 Customizing Questions

The questions are hardcoded in the backend. To change them:

1. Edit `backend/server.js`
2. Find the `QUESTIONS` array (around line 18)
3. Update the questions and answers:

```javascript
const QUESTIONS = [
  { id: 1, text: "Your question here?", truth: "The correct answer" },
  // ... 14 more questions
];
```

4. Save and redeploy to Railway

**Note:** The game is designed for exactly 15 questions. You can change this, but make sure all questions have sequential IDs starting from 1.

---

## 🎨 Features

- **Real-time multiplayer** with Socket.IO
- **Mobile-first design** for players
- **TV-optimized display** for host view
- **Beautiful gradients** and animations
- **Live timers** (30s for lies, 20s for voting)
- **Live progress tracking** (host can see who submitted/voted)
- **Automatic scoring**
- **Final podium** with top 3 winners

---

## 🔧 Troubleshooting

### Players can't connect

- Make sure the backend `FRONTEND_URL` matches your Vercel URL
- Check that Railway service is running
- Verify the frontend `VITE_SOCKET_URL` environment variable

### "Room not found" error

- Make sure the backend is running
- Check that players are entering the correct 4-digit code
- Try creating a new room

### Timer not showing

- Refresh the page
- Check browser console for errors

### Game stuck on a phase

- The host can refresh and create a new room
- Make sure all players submitted their answers/votes

---

## 📱 Browser Compatibility

- **Recommended:** Chrome, Safari, Firefox (latest versions)
- **Mobile:** iOS Safari, Chrome on Android
- **TV/Host:** Any modern browser on laptop/desktop

---

## 🎉 Tips for a Great Game

1. **Test before the party** - Run through one full game to make sure everything works
2. **Have a backup plan** - Keep paper and pens just in case
3. **Encourage creativity** - The funnier the fake answers, the better!
4. **Keep it moving** - Don't wait for stragglers, the timers will advance automatically
5. **Make it visible** - Make sure everyone can see the TV/projector clearly

---

## 📄 License

This is a personal project for a private event. Feel free to use and modify for your own parties!

---

## 💝 Credits

Built with love for Cristi & Juanqui's special day!

Inspired by the game Fibbage by Jackbox Games.
