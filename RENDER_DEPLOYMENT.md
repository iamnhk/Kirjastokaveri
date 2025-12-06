# 🚀 Deploying Kirjastokaveri to Render

This guide will help you deploy your full-stack application to Render in **under 5 minutes** with **full automation**.

## ✨ What You Get

- ✅ **FREE hosting** (Render free tier)
- ✅ **Auto-deploy on Git push** (no manual steps!)
- ✅ **PostgreSQL database** (automatically configured)
- ✅ **SSL certificates** (HTTPS enabled)
- ✅ **Environment variables** (auto-injected)

---

## 📋 Prerequisites

1. GitHub account with your Kirjastokaveri repository
2. Render account (sign up at [render.com](https://render.com) - **FREE**)

---

## 🎯 Deployment Steps

### Step 1: Sign Up to Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with your **GitHub account** (recommended)

### Step 2: Deploy with Blueprint

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository: `iamnhk/Kirjastokaveri`
3. Render will detect `render.yaml` and show:
   - ✅ PostgreSQL Database
   - ✅ Backend Service (FastAPI)
   - ✅ Frontend Service (React)
4. Click **"Apply"**

### Step 3: Wait for Deployment

Render will automatically:
- ✅ Create PostgreSQL database
- ✅ Build backend Docker image
- ✅ Build frontend Docker image
- ✅ Configure environment variables
- ✅ Run database migrations
- ✅ Deploy both services

**Initial deployment takes ~5-10 minutes**

### Step 4: Update CORS Settings

After deployment, you'll get URLs like:
- Backend: `https://kirjastokaveri-backend.onrender.com`
- Frontend: `https://kirjastokaveri-frontend.onrender.com`

1. Go to Render dashboard → **kirjastokaveri-backend** service
2. Click **"Environment"**
3. Update `KIRJASTO_CORS_ALLOW_ORIGINS`:
   ```
   ["https://kirjastokaveri-frontend.onrender.com"]
   ```
4. Save (auto-redeploys)

### Step 5: Test Your App

Visit your frontend URL: `https://kirjastokaveri-frontend.onrender.com`

---

## 🔄 Auto-Deploy on Git Push

**No configuration needed!** Render automatically:
- Watches your `main` branch
- Deploys on every push
- Shows build logs in dashboard

---

## 🔧 Environment Variables

All variables are **automatically configured** via `render.yaml`:

| Variable | Source | Notes |
|----------|--------|-------|
| `KIRJASTO_DATABASE_URL` | Auto-injected from DB | ✅ Done |
| `KIRJASTO_SECRET_KEY` | Auto-generated | ✅ Done |
| `VITE_API_BASE_URL` | Auto-injected from backend | ✅ Done |

---

## 💡 Free Tier Limitations

- Backend **spins down after 15 min** of inactivity
- **Cold start**: ~30 seconds on first request
- **750 hours/month** free (enough for small projects)

### Prevent Spin-Down (Optional)

Use a free service like [UptimeRobot](https://uptimerobot.com):
1. Ping your backend every 10 minutes
2. Keeps service warm

---

## 🐛 Troubleshooting

### Frontend shows "API Error"

1. Check backend URL in Render dashboard
2. Update `VITE_API_BASE_URL` in frontend environment
3. Redeploy frontend

### Database connection error

1. Go to Render dashboard → Database
2. Check "Internal Database URL"
3. Verify backend has correct `KIRJASTO_DATABASE_URL`

### Build fails

1. Check Render logs (Dashboard → Service → Logs)
2. Verify Dockerfiles are correct
3. Check `render.yaml` syntax

---

## 📊 Monitoring

View real-time logs:
1. Render Dashboard → Select service
2. Click **"Logs"** tab
3. See live application logs

---

## 🎉 Done!

Your app is now:
- ✅ Deployed to production
- ✅ Auto-deploying on Git push
- ✅ Using PostgreSQL database
- ✅ Secured with HTTPS
- ✅ **100% FREE**

### Next Git Push

Simply:
```bash
git add .
git commit -m "your changes"
git push origin main
```

**Render automatically deploys!** 🚀

---

## 📞 Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)

---

**Deployment time:** ~5 minutes  
**Monthly cost:** $0 (FREE tier)  
**Automation:** 100% (zero manual steps after setup)
