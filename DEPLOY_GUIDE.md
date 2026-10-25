# 🚀 Glamora Fashion Store — Vercel & MongoDB Atlas Deployment Guide

Your project is now **100% Vercel-ready** and supports serverless execution, dynamic domain routing, and cloud database pooling out of the box.

Follow these 3 simple steps to deploy your project live:

---

## Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

Since local MongoDB (`127.0.0.1:27017`) cannot be reached by cloud servers, you need a free cloud database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create a Deployment** and select the **M0 Free** tier.
3. Under **Security Quickstart**:
   - Create a **Username** and **Password** (e.g. `glamora_admin` / your password). *Save these!*
   - Under **Where would you like to connect from?**, select **Network Access**:
     - Add IP address: `0.0.0.0/0` (Description: `Allow all for Vercel`).
     > *Note: This is required because Vercel serverless functions use dynamic IP addresses.*
4. Click **Connect** → **Drivers** (Node.js) and copy your connection string. It looks like:
   ```env
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fashionstore?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with the credentials you created in step 3.
6. **(Optional) Seed initial products & admin account to your cloud DB**:
   - In your local `backend/.env`, temporarily paste your new `MONGO_URI`.
   - Run:
     ```bash
     npm --prefix backend run seed
     ```
   - This automatically creates the catalog products, the admin user (`admin@glamora.com` / `adminpassword123`), and a customer user!

---

## Step 2: Push Your Project to GitHub

Make sure all your changes and new Vercel configuration files are committed and pushed:

```bash
git add .
git commit -m "Configure project for Vercel deployment and MongoDB Atlas"
git push origin main
```

---

## Step 3: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Select your `fashion-store` GitHub repository and click **Import**.
3. Under **Project Settings**:
   - **Framework Preset**: Other (Vercel automatically detects `vercel.json`).
   - **Root Directory**: `./` (leave default).
4. Open the **Environment Variables** accordion and add the following variables:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://<user>:<pwd>@cluster0.xxx.mongodb.net/fashionstore?...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `glamora_super_secret_jwt_key_2026` | Any strong secret string for auth tokens |
| `SESSION_SECRET` | `glamora_super_secret_session_key_2026` | Secret for admin sessions |
| `NODE_ENV` | `production` | Production environment |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `your_supabase_anon_key` | Your Supabase anon or service key |
| `SUPABASE_BUCKET` | `glamora` | Supabase storage bucket name |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini AI API key |

5. Click **Deploy**! 🚀

---

## How It Works Behind the Scenes

- **`vercel.json`**: Configures Vercel to build the React frontend into `frontend/build` and rewrite `/api/*` and `/dashboard/*` requests to the serverless function.
- **`api/index.js`**: Exports the Express backend as a high-performance Vercel Serverless Function.
- **Serverless Mongoose Connection Pooling**: In `backend/src/config/db.js`, MongoDB connections are cached across serverless warm starts using `global.mongoose`, eliminating Atlas connection pool exhaustion.
- **Dynamic API Routing**: `frontend/src/config/api.js` automatically uses relative `/api` paths in production on Vercel (eliminating CORS and port mismatches), while continuing to use `http://localhost:5000` during local development.

