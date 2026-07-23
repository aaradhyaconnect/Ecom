# Femme Drip — Hostinger VPS Deployment Guide

## Prerequisites

1. Hostinger VPS KVM 2 (or higher) with Ubuntu 22.04/24.04
2. Domain pointed to VPS IP (A record)
3. SSH access from Hostinger hPanel
4. Your `.env.local` values ready

---

## Step 1: Initial Server Setup

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser deploy
usermod -aG sudo deploy

# Set up firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Switch to deploy user
su - deploy
```

## Step 2: Install Node.js 22 LTS

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

# Install Node.js
nvm install 22
nvm use 22
node -v  # Should show v22.x.x
npm -v
```

## Step 3: Install PM2

```bash
npm install -g pm2

# Start PM2 on boot
pm2 startup systemd -u deploy --hp /home/deploy
# Run the command it outputs
```

## Step 4: Clone and Build

```bash
# Clone your repo
cd /home/deploy
git clone https://github.com/aaradhyaconnect/Ecom.git femme-drip
cd femme-drip

# Install dependencies
npm install

# Create .env.local
nano .env.local
# Paste all your environment variables, then save (Ctrl+O, Enter, Ctrl+X)

# Build
npm run build
```

## Step 5: Configure PM2

```bash
# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "femme-drip",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/home/deploy/femme-drip",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/home/deploy/logs/g2i-error.log",
      out_file: "/home/deploy/logs/g2i-out.log",
    },
  ],
};
EOF

# Create logs directory
mkdir -p /home/deploy/logs

# Start the app
pm2 start ecosystem.config.js
pm2 save

# Verify it's running
pm2 status
curl http://localhost:3000
```

## Step 6: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/femme-drip
```

Paste this config:

```nginx
server {
    listen 80;
    server_name femmedrip.com www.femmedrip.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name femmedrip.com www.femmedrip.com;

    # SSL will be configured by Certbot in Step 7

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Next.js static assets (aggressive caching)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # PWA service worker (no cache)
    location /sw.js {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Static assets (images, etc.)
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API routes — no caching
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Webhook routes — no buffering
    location /api/webhooks/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        client_max_body_size 10M;
    }

    # Upload endpoint — larger body
    location /api/upload {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    # Everything else
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Disable .dotfile access
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/femme-drip /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: SSL with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d femmedrip.com -d www.femmedrip.com

# Auto-renewal is set up by default. Verify:
sudo certbot renew --dry-run
```

## Step 8: Update Environment Variables

Update these in `.env.local` on the VPS:

```env
NEXT_PUBLIC_SITE_URL=https://femmedrip.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

CASHFREE_APP_ID=your_cashfree_id
CASHFREE_SECRET_KEY=your_cashfree_secret
CASHFREE_API_URL=https://api.cashfree.com/pg

SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password

RESEND_API_KEY=your_resend_key
EMAIL_FROM_ADDRESS=orders@femmedrip.com

NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-bfd52c501031474e9474ff3c3b7e3ca5.r2.dev

NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_token
```

Then rebuild:

```bash
cd /home/deploy/femme-drip
pm2 restart femme-drip
```

## Step 9: Domain & Webhooks

Update these URLs to your new domain:

1. **Cashfree Dashboard** — Set webhook URL to `https://femmedrip.com/api/webhooks/cashfree`
2. **Shiprocket Dashboard** — Set webhook URL to `https://femmedrip.com/api/webhooks/shiprocket`
3. **Supabase Auth** — Set Site URL to `https://femmedrip.com`
4. **Supabase Auth** — Add `https://femmedrip.com` to Redirect URLs

## Step 10: PM2 Management Commands

```bash
pm2 status              # Check status
pm2 logs femme-drip      # View logs
pm2 logs femme-drip --err # View errors only
pm2 restart femme-drip   # Restart app
pm2 stop femme-drip      # Stop app
pm2 delete femme-drip    # Delete app
```

## Step 11: Auto-Deploy on Git Push (Optional)

```bash
# Install git hooks
cd /home/deploy/femme-drip
cat > .git/hooks/post-receive << 'HOOK'
#!/bin/bash
GIT_WORK_TREE=/home/deploy/femme-drip git checkout main
cd /home/deploy/femme-drip
npm install --omit=dev
npm run build
pm2 restart femme-drip
HOOK
chmod +x .git/hooks/post-receive
```

## Step 12: Set Up Swap (Recommended for 4GB VPS)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Step 13: Run Database Migrations

In Supabase SQL editor, run:
- `00018_fulfillment_system.sql`
- `00019_supplier_portal.sql`

## Troubleshooting

### App not loading
```bash
pm2 logs femme-drip --err
curl -I http://localhost:3000
```

### 502 Bad Gateway
```bash
pm2 status  # Is the app running?
curl http://localhost:3000  # Can Nginx reach it?
sudo nginx -t  # Is Nginx config valid?
```

### SSL not working
```bash
sudo certbot --nginx -d femmedrip.com -d www.femmedrip.com
sudo systemctl reload nginx
```

### Webhooks not receiving
```bash
# Check if Cashfree/Shiprocket can reach your server
curl https://femmedrip.com/api/health
```

### Memory issues
```bash
free -h
pm2 monit  # Watch memory usage in real-time
# If consistently > 4GB, upgrade to KVM 4
```
