# FasalSetu.Ai Deployment Guide

This guide covers the end-to-end deployment of **FasalSetu.Ai** using Vercel (Frontend), Render (Java Backend + Python AI Engine), and Aiven (MySQL Database).

I have already updated your codebase with the necessary configuration files, Dockerfiles, and Environment Variable support. All you need to do is follow these steps.

---

## 1. Setup the Database (Aiven for MySQL)
We are using Aiven because it gives you a free, permanently hosted MySQL database that requires absolutely zero code changes on your end.

1. Go to [Aiven.io](https://aiven.io/) and create a free account.
2. Click **Create Service** and select **MySQL**.
3. Choose the **Free Plan** and select a region closest to your users (e.g., India or Singapore).
4. Once the service is running, look for the **Service URI** in the overview tab.
5. The URI will look something like this: `mysql://avnadmin:your_password@your-db-name.aivencloud.com:21332/defaultdb?ssl-mode=REQUIRED`
6. Keep this URI handy.

---

## 2. Deploy the Backends (Render)
You have two backend services: the **Spring Boot Java API** and the **FastAPI AI Engine**. We will deploy both to Render.com using the Dockerfiles I just created for you.

### A. Deploying the Spring Boot Backend
1. Create a free account on [Render.com](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`FasalSetu.Ai`).
4. **Configuration Settings:**
   - **Name:** `fasalsetu-backend` (or similar)
   - **Root Directory:** `FasalSetu.Ai/backend`
   - **Environment:** `Docker`
   - **Instance Type:** Free
5. **Environment Variables:**
   Scroll down and click **Advanced** -> **Add Environment Variable**. Add the following based on your Aiven database details:
   - `DB_URL` : `jdbc:mysql://your-db-name.aivencloud.com:21332/defaultdb?useSSL=true` *(Extract this from your Aiven Service URI)*
   - `DB_USERNAME` : `avnadmin` *(or whatever your Aiven username is)*
   - `DB_PASSWORD` : `your_password_here`
6. Click **Create Web Service**. Wait for it to build and deploy.
7. **Copy the URL** provided by Render (e.g., `https://fasalsetu-backend.onrender.com`).

### B. Deploying the FastAPI AI Engine
1. Click **New +** and select **Web Service** again.
2. Connect your GitHub repository.
3. **Configuration Settings:**
   - **Name:** `fasalsetu-ai-engine` (or similar)
   - **Root Directory:** `FasalSetu.Ai/ai-engine`
   - **Environment:** `Docker`
   - **Instance Type:** Free
4. Click **Create Web Service**. Wait for it to build and deploy.
5. **Copy the URL** provided by Render (e.g., `https://fasalsetu-ai-engine.onrender.com`).

---

## 3. Deploy the Frontend (Vercel)
Vercel is the easiest platform for deploying React/Vite applications.

1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **Add New** -> **Project**.
3. Import your `FasalSetu.Ai` repository.
4. **Configuration Settings:**
   - **Root Directory:** Edit this and select `FasalSetu.Ai/frontend`.
   - **Framework Preset:** Vite (it should auto-detect this).
5. **Environment Variables:**
   Expand the Environment Variables section and add the two URLs you got from Render:
   - `VITE_API_BASE_URL` : `https://fasalsetu-backend.onrender.com/api` *(Make sure to append /api)*
   - `VITE_AI_API_BASE_URL` : `https://fasalsetu-ai-engine.onrender.com`
6. Click **Deploy**.

---

## Important Notes for Free Tiers
- **Render Cold Starts:** Because you are on the Free tier on Render, your backends will go to "sleep" after 15 minutes of inactivity. When you try to log in or use the app after it has been asleep, the very first request might take **50 seconds** to load. This is normal for free hosting.
- **Push your code:** Before doing any of the steps above, make sure you commit and push the new `Dockerfile` and `application.properties` changes I just made to your GitHub repository!

<!-- Triggering fresh deployment to correct repository -->
