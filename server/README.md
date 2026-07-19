# Leaderboard API

The frontend reads and writes leaderboard data through `/api/leaderboard/*`.
This Node.js service stores records in SQLite.

## Server Setup

```bash
cd /var/www/henry_games
git pull origin main

sudo apt install -y sqlite3 build-essential
npm install --prefix server

./scripts/init-leaderboard-db.sh
node scripts/migrate-account-db.mjs
node scripts/migrate-student-points-db.mjs
pm2 start server/leaderboard-api.cjs --name henry-games-api
pm2 save
```

Default API settings:

```text
Host: 127.0.0.1
Port: 3001
Database: /var/www/henry_games_api/data/leaderboard.sqlite
```

Override the database path if needed:

```bash
LEADERBOARD_DB_PATH=/custom/path/leaderboard.sqlite pm2 start server/leaderboard-api.cjs --name henry-games-api
```

## Nginx

Add this inside the website `server { ... }` block:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Keep the SPA route fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Smoke Test

```bash
curl http://127.0.0.1:3001/api/leaderboard/challenge
curl https://你的域名/api/leaderboard/challenge
```

## Account Migration

After pulling the account feature on an existing server, run:

```bash
cd /var/www/henry_games
npm install --prefix server
node scripts/migrate-account-db.mjs
node scripts/migrate-student-points-db.mjs
pm2 restart henry-games-api
npm run build
```

The migration keeps existing anonymous leaderboard records and adds account-aware fields:

```text
users
challenge_leaderboard.user_id
fixed_leaderboard.user_id
student_point_records
```
