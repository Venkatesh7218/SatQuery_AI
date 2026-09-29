# 🚀 SatQuery-AI Deployment Guide

This guide covers step-by-step instructions to deploy **SatQuery-AI** to production cloud platforms.

---

## 📋 Pre-Deployment Checklist
- [x] `requirements.txt` includes production dependencies (`gunicorn`, `opencv-python-headless`, `numpy`, `Pillow`).
- [x] `Procfile` configured for Gunicorn WSGI.
- [x] `Dockerfile` ready for containerized hosting.
- [x] `.env.example` created with required variables.
- [ ] Your **Groq API Key** (from [console.groq.com/keys](https://console.groq.com/keys)).

---

## 🌟 Method 1: Deploy on Render (Recommended, Easiest)

Render provides free/inexpensive web service hosting with automatic HTTPS and Git CI/CD.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "SatQuery-AI production ready"
   git remote add origin https://github.com/<your-username>/satquery-ai.git
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) and log in.
3. Click **New +** $\rightarrow$ **Web Service**.
4. Connect your GitHub repository `satquery-ai`.
5. Configure the service:
   - **Name:** `satquery-ai`
   - **Region:** Any (e.g., Singapore or US East)
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
6. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `gsk_your_groq_api_key_here`
   - `SECRET_KEY`: `<generate-a-random-secret-string>`
   - `PYTHON_VERSION`: `3.11.9`
7. Click **Create Web Service**.
8. Your platform will be live at `https://satquery-ai.onrender.com` in 2-3 minutes!

---

## ⚡ Method 2: Deploy on Railway

Railway offers fast zero-configuration deployments.

### Steps:
1. Push your repository to GitHub.
2. Go to [railway.app](https://railway.app) and click **Start a New Project**.
3. Select **Deploy from GitHub repo** and pick `satquery-ai`.
4. Railway will automatically detect the `Procfile` or `Dockerfile`.
5. In **Variables**, add:
   - `GROQ_API_KEY` = your Groq API key
   - `SECRET_KEY` = random string
6. Click **Generate Domain** in Service Settings.
7. Your app is live!

---

## 🤗 Method 3: Deploy on Hugging Face Spaces (Free Docker)

Ideal for AI showcases, hackathon juries, and portfolio demos.

### Steps:
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space Name: `satquery-ai`
3. Space SDK: **Docker** (Blank).
4. In Space **Settings** $\rightarrow$ **Variables and secrets**, add a new Secret:
   - Key: `GROQ_API_KEY`
   - Value: `gsk_your_groq_api_key`
5. Clone the space repo and push your code:
   ```bash
   git remote add hf https://huggingface.co/spaces/<your-username>/satquery-ai
   git push hf main
   ```
6. Hugging Face builds the Docker container automatically and serves your live web UI!

---

## 🖥️ Method 4: Deploy on Linux VPS (AWS EC2 / DigitalOcean / Ubuntu)

### 1. Connect and Install Environment:
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv git nginx
git clone https://github.com/<your-username>/satquery-ai.git /var/www/satquery
cd /var/www/satquery
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Create `.env` file:
```bash
nano .env
```
Paste your `GROQ_API_KEY` and `SECRET_KEY`.

### 3. Create Systemd Service (`/etc/systemd/system/satquery.service`):
```ini
[Unit]
Description=SatQuery AI Flask Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/satquery
Environment="PATH=/var/www/satquery/venv/bin"
ExecStart=/var/www/satquery/venv/bin/gunicorn app:app --bind 127.0.0.1:5000 --workers 2 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start satquery
sudo systemctl enable satquery
```

### 4. Configure Nginx Reverse Proxy with SSL:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
