# 🚀 Deployment Checklist

Follow these steps to deploy your Fibbage game to Railway and Vercel.

## ✅ Pre-Deployment Checklist

- [x] Code is complete
- [x] Dependencies installed
- [ ] Tested locally (see below)
- [ ] GitHub repository created and code pushed
- [ ] Railway account ready
- [ ] Vercel account ready

---

## 🧪 Test Locally First (IMPORTANT!)

Before deploying, test that everything works:

### Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```
You should see: "Server running on port 3000"

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```
You should see: "Local: http://localhost:5173"

### Test the Game:
1. Open http://localhost:5173 in your browser
2. Click "Host Game (TV)"
3. Note the 4-digit room code
4. Open http://localhost:5173 in a different browser/incognito window
5. Click "Join Game (Player)" and enter the room code
6. Play through one question to verify everything works

---

## 📤 Step 1: Push to GitHub

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Initial commit - Fibbage bridal shower game"

# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/fibbage-bridal.git
git branch -M main
git push -u origin main
```

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click "Login" (use GitHub)
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your `fibbage-bridal` repository
6. Railway will detect it's a Node.js project

### 2.2 Configure Backend Service

1. After deployment starts, click on your service
2. Go to "Settings" tab
3. Under "Service Settings":
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty)
   - **Start Command:** `npm start`
4. Click "Variables" tab
5. Click "New Variable"
   - **Variable:** `PORT`
   - **Value:** `3000`
6. Click "New Variable"
   - **Variable:** `FRONTEND_URL`
   - **Value:** `http://localhost:5173` (temporary, we'll update this)

### 2.3 Get Your Railway URL

1. Click on "Settings" tab
2. Find "Domains" section
3. Click "Generate Domain"
4. **COPY THIS URL** (e.g., `https://fibbage-bridal-production.up.railway.app`)
5. Save it somewhere - you'll need it for the frontend

---

## ▲ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to https://vercel.com
2. Click "Login" (use GitHub)
3. Click "Add New..." → "Project"
4. Find and import your `fibbage-bridal` repository
5. Click "Import"

### 3.2 Configure Frontend

1. **Framework Preset:** Vite
2. **Root Directory:** Click "Edit" → select `frontend`
3. **Build Command:** `npm run build` (should be auto-detected)
4. **Output Directory:** `dist` (should be auto-detected)
5. Click "Environment Variables"
6. Add variable:
   - **Name:** `VITE_SOCKET_URL`
   - **Value:** [YOUR RAILWAY URL FROM STEP 2.3]
   - Example: `https://fibbage-bridal-production.up.railway.app`
7. Click "Deploy"

### 3.3 Get Your Vercel URL

1. Wait for deployment to complete
2. You'll see a success screen with your URL
3. **COPY THIS URL** (e.g., `https://fibbage-bridal.vercel.app`)
4. Save it - you need to update the backend

---

## 🔄 Step 4: Update Backend CORS

Now that you have your Vercel URL, update the backend:

1. Go back to **Railway**
2. Click on your service
3. Click "Variables" tab
4. Find the `FRONTEND_URL` variable
5. Click to edit it
6. Change value to your **Vercel URL** (e.g., `https://fibbage-bridal.vercel.app`)
7. Railway will automatically redeploy

---

## ✅ Step 5: Test Production

1. Open your **Vercel URL** in a browser
2. Click "Host Game (TV)"
3. Note the room code
4. Open your **Vercel URL** on your phone
5. Join the room
6. Play through one question to make sure everything works

**If you get connection errors:**
- Check that Railway service is running (green status)
- Verify the `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Verify the `VITE_SOCKET_URL` in Vercel matches your Railway URL exactly
- Check Railway logs for errors (click "Deployments" → latest deployment → "View Logs")

---

## 🎯 Step 6: Customize Questions

The game comes with 15 placeholder questions. You MUST customize them:

1. Go to your GitHub repository
2. Open `backend/server.js`
3. Find line ~18 with the `QUESTIONS` array
4. Click "Edit" (pencil icon)
5. Replace each question and truth with real facts about Cristi & Juanqui
6. Commit changes
7. Railway will automatically redeploy with new questions

**Example:**
```javascript
const QUESTIONS = [
  { id: 1, text: "¿Dónde se conocieron Cristi y Juanqui?", truth: "En la universidad" },
  { id: 2, text: "¿Cuál fue su primera película juntos?", truth: "Avengers" },
  // ... 13 more questions
];
```

---

## 📱 Step 7: Day-of-Event Setup

### What you need:
- Computer/laptop connected to TV (HDMI cable)
- Good WiFi connection
- Everyone's phones charged

### Setup process:
1. Connect laptop to TV
2. Open your **Vercel URL** in browser
3. Press F11 for fullscreen (recommended)
4. Click "Host Game (TV)"
5. Write the 4-digit room code on a whiteboard or share screen
6. Have guests open the same URL on their phones
7. They click "Join Game" and enter the code
8. Wait for everyone to join (you'll see names appear)
9. Click "Start Game"!

---

## 🔧 Troubleshooting

### Players can't connect
- Check WiFi - everyone must be on the same network or have internet
- Make sure they're using the correct URL
- Try having them refresh their browser

### "Room not found" error
- Make sure backend is running (check Railway dashboard)
- Try creating a new room
- Check Railway logs for errors

### Game is laggy
- Check WiFi signal strength
- Close unnecessary tabs
- Restart the game

### Questions didn't update
- Go to Railway → Deployments → check latest deployment succeeded
- Check Railway logs for errors
- Make sure you committed and pushed changes to GitHub

---

## 🎉 You're Ready!

Everything is set up! The URLs will work forever (or until you delete the projects).

**Your URLs:**
- Frontend (share this): `https://your-app.vercel.app`
- Backend (don't share): `https://your-app.railway.app`

Both Vercel and Railway have free tiers that are perfect for a one-time event like this.

Good luck with the bridal shower! 💍
