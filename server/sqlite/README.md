# Leaderboard SQLite Schema

This folder stores the persistent SQLite schema for cloud leaderboard records.

Default server initialization:

```bash
cd /var/www/henry_games
git pull origin main
sudo apt install -y sqlite3
./scripts/init-leaderboard-db.sh
```

The default database path is:

```text
/var/www/henry_games_api/data/leaderboard.sqlite
```

To use a custom path:

```bash
LEADERBOARD_DB_PATH=/custom/path/leaderboard.sqlite ./scripts/init-leaderboard-db.sh
```
