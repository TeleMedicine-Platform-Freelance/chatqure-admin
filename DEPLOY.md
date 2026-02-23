# Deploy chatqure-admin to server (stagingadmin.chatqure.com)

**Same server as staging API:** This app runs on port **8080** so it doesn’t conflict with the container that serves `stagingapi.chatqure.com`. You need a **reverse proxy** on the host (nginx, Caddy, or Traefik) that listens on 80/443 and routes:

- `stagingapi.chatqure.com` → your API container (existing)
- `stagingadmin.chatqure.com` → `http://127.0.0.1:8080` (this app)

---

## 1. Push your code

From your **local machine** (in the project folder):

```bash
git add .
git commit -m "Docker setup for chatqure-admin"
git push origin main
```

(Use your real branch name if not `main`.)

---

## 2. On the server – one-time setup

SSH into the server:

```bash
ssh user@your-server-ip
```

Install Docker and Docker Compose if not already installed (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and back in so docker runs without sudo
```

Create a folder and clone the repo:

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/YOUR_ORG/chatqure-admin.git
cd chatqure-admin
```

(Replace with your real repo URL.)

---

## 3. Configure environment (optional)

Create `.env` on the server if you need to override API URL or other build args:

```bash
cp .env.example .env
nano .env   # set VITE_API_BASE_URL etc. if needed
```

If you don’t create `.env`, the defaults in `docker-compose.yml` (e.g. `https://stagingapi.chatqure.com/`) are used.

---

## 4. Build and run

Still in `~/apps/chatqure-admin` on the server:

```bash
docker compose up --build -d
```

Check that the container is running:

```bash
docker compose ps
curl -I http://localhost:8080
```

---

## 5. Reverse proxy (stagingadmin.chatqure.com → this container)

Port 80 is already used by your API. The admin app listens on **8080**. Configure your **host reverse proxy** so that `stagingadmin.chatqure.com` is proxied to `http://127.0.0.1:8080`.

**Example – nginx on the host** (add a server block, or a new file under `sites-available`):

```nginx
server {
    listen 80;
    server_name stagingadmin.chatqure.com;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload nginx: `sudo nginx -t && sudo systemctl reload nginx`

**Example – Caddy** (add to Caddyfile):

```
stagingadmin.chatqure.com {
    reverse_proxy localhost:8080
}
```

---

## 6. DNS

In your DNS (where you manage chatqure.com):

- Add an **A record**: `stagingadmin` → your server’s **public IP** (same as stagingapi if on the same server).

Then open **http://stagingadmin.chatqure.com** – you should see the admin app (via the reverse proxy).

---

## 7. (Optional) HTTPS with Certbot

When you’re ready for HTTPS:

1. Install Certbot on the server:

   ```bash
   sudo apt install -y certbot
   ```

2. Get the certificate (your reverse proxy uses port 80; use webroot if nginx serves a path, or standalone only if you can stop the proxy briefly):

   ```bash
   sudo mkdir -p /var/www/certbot
   sudo certbot certonly --webroot -w /var/www/certbot -d stagingadmin.chatqure.com
   ```

   (If your reverse proxy is nginx, Certbot can use it: `sudo certbot --nginx -d stagingadmin.chatqure.com` to get the cert and auto-configure HTTPS.)

3. In the **host** reverse proxy, add HTTPS for `stagingadmin.chatqure.com` (e.g. Certbot’s nginx plugin does this). The admin container stays on 8080; the host proxy terminates SSL and forwards to `http://127.0.0.1:8080`.

Renew certs (Let’s Encrypt expiry): set up a cron job or systemd timer for:

```bash
sudo certbot renew
```

---

## Useful commands

| Task              | Command |
|-------------------|--------|
| View logs         | `docker compose logs -f` |
| Restart            | `docker compose restart` |
| Rebuild after code | `git pull && docker compose up --build -d` |
| Stop               | `docker compose down` |
